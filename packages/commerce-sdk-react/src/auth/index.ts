/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    helpers,
    ShopperLogin,
    ShopperCustomers,
    ShopperLoginTypes,
    ShopperCustomersTypes
} from 'commerce-sdk-isomorphic'
import {jwtDecode, JwtPayload} from 'jwt-decode'
import {ApiClientConfigParams, Prettify, RemoveStringIndex} from '../hooks/types'
import {BaseStorage, LocalStorage, CookieStorage, MemoryStorage, StorageType} from './storage'
import {CustomerType} from '../hooks/useCustomerType'
import {
    getParentOrigin,
    isOriginTrusted,
    onClient,
    getDefaultCookieAttributes,
    isAbsoluteUrl,
    stringToBase64,
    extractCustomParameters
} from '../utils'
import {
    MOBIFY_PATH,
    SLAS_PRIVATE_PROXY_PATH,
    SLAS_SECRET_WARNING_MSG,
    SLAS_SECRET_PLACEHOLDER,
    SLAS_SECRET_OVERRIDE_MSG,
    DNT_COOKIE_NAME,
    DWSID_COOKIE_NAME,
    SLAS_REFRESH_TOKEN_COOKIE_TTL_OVERRIDE_MSG
} from '../constant'

import {Logger} from '../types'

type TokenResponse = ShopperLoginTypes.TokenResponse
type TrustedAgentTokenRequest = ShopperLoginTypes.TrustedAgentTokenRequest
type Helpers = typeof helpers
interface AuthConfig extends ApiClientConfigParams {
    redirectURI: string
    proxy: string
    fetchOptions?: ShopperLoginTypes.FetchOptions
    fetchedToken?: string
    enablePWAKitPrivateClient?: boolean
    clientSecret?: string
    silenceWarnings?: boolean
    logger: Logger
    defaultDnt?: boolean
    passwordlessLoginCallbackURI?: string
    refreshTokenRegisteredCookieTTL?: number
    refreshTokenGuestCookieTTL?: number
}

interface JWTHeaders {
    exp: number
    iat: number
}

interface SlasJwtPayload extends JwtPayload {
    sub: string
    isb: string
    dnt: string
}

type AuthorizeIDPParams = Parameters<Helpers['authorizeIDP']>[1]
type LoginIDPUserParams = Parameters<Helpers['loginIDPUser']>[2]
type AuthorizePasswordlessParams = Parameters<Helpers['authorizePasswordless']>[2]
type LoginPasswordlessParams = Parameters<Helpers['getPasswordLessAccessToken']>[2]
type LoginRegisteredUserB2CCredentials = Parameters<Helpers['loginRegisteredUserB2C']>[1]

/**
 * This is a temporary type until we can make a breaking change and modify the signature for
 * loginRegisteredUserB2C so that it takes in a body rather than just credentials
 *
 */
type LoginRegisteredUserCredentialsWithCustomParams = LoginRegisteredUserB2CCredentials & {
    options?: {body: helpers.CustomRequestBody}
}

/**
 * The extended field is not from api response, we manually store the auth type,
 * so we don't need to make another API call when we already have the data.
 * Plus, the getCustomer endpoint only works for registered user, it returns a 404 for a guest user,
 * and it's not easy to grab this info in user land, so we add it into the Auth object, and expose it via a hook
 */
export type AuthData = Prettify<
    RemoveStringIndex<TokenResponse> & {
        customer_type: CustomerType
        idp_access_token: string
    }
>

/** A shopper could be guest or registered, so we store the refresh tokens individually. */
type AuthDataKeys =
    | Exclude<keyof AuthData, 'refresh_token'>
    | 'refresh_token_guest'
    | 'refresh_token_registered'
    | 'access_token_sfra'
    | typeof DNT_COOKIE_NAME
    | typeof DWSID_COOKIE_NAME
    | 'code_verifier'
    | 'uido'

type AuthDataMap = Record<
    AuthDataKeys,
    {
        storageType: StorageType
        key: string
        callback?: (storage: BaseStorage) => void
    }
>
type DntOptions = {
    includeDefaults: boolean
}

const isParentTrusted = isOriginTrusted(getParentOrigin())

/**
 * A map of the data that this auth module stores. This maps the name of the property to
 * the storage type and the key when stored in that storage. You can also pass in a "callback"
 * function to do extra operation after a property is set.
 */
const DATA_MAP: AuthDataMap = {
    access_token: {
        storageType: 'local',
        key: 'access_token'
    },
    customer_id: {
        storageType: 'local',
        key: 'customer_id'
    },
    usid: {
        storageType: 'cookie',
        key: 'usid'
    },
    enc_user_id: {
        storageType: 'local',
        key: 'enc_user_id'
    },
    expires_in: {
        storageType: 'local',
        key: 'expires_in'
    },
    id_token: {
        storageType: 'local',
        key: 'id_token'
    },
    idp_access_token: {
        storageType: 'local',
        key: 'idp_access_token'
    },
    token_type: {
        storageType: 'local',
        key: 'token_type'
    },
    refresh_token_guest: {
        storageType: 'cookie',
        key: isParentTrusted ? 'cc-nx-g-iframe' : 'cc-nx-g',
        callback: (store) => {
            store.delete(isParentTrusted ? 'cc-nx-iframe' : 'cc-nx')
        }
    },
    refresh_token_registered: {
        storageType: 'cookie',
        key: isParentTrusted ? 'cc-nx-iframe' : 'cc-nx',
        callback: (store) => {
            store.delete(isParentTrusted ? 'cc-nx-g-iframe' : 'cc-nx-g')
        }
    },
    refresh_token_expires_in: {
        storageType: 'local',
        key: 'refresh_token_expires_in'
    },
    customer_type: {
        storageType: 'local',
        key: 'customer_type'
    },
    /*
     * For Hybrid setups, we need a mechanism to inform PWA Kit whenever customer login state changes on SFRA.
     * We do this by having SFRA store the access token in cookies. If these cookies are present, PWA
     * compares the access token from the cookie with the one in local store. If the tokens are different,
     * discard the access token in local store and replace it with the access token from the cookie.
     *
     * ECOM has a 1200 character limit on the values of cookies. The access token easily exceeds this amount
     * so it sends the access token in chunks across several cookies.
     *
     * The JWT tends to come in at around 2250 characters so there's usually
     * both a cc-at and cc-at_2.
     */
    access_token_sfra: {
        storageType: 'cookie',
        key: 'cc-at'
    },
    [DNT_COOKIE_NAME]: {
        storageType: 'cookie',
        key: DNT_COOKIE_NAME
    },
    dwsid: {
        storageType: 'cookie',
        key: DWSID_COOKIE_NAME
    },
    code_verifier: {
        storageType: 'local',
        key: 'code_verifier'
    },
    uido: {
        storageType: 'local',
        key: 'uido'
    }
}

export const DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL = 90 * 24 * 60 * 60
export const DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL = 30 * 24 * 60 * 60

/**
 * This class is used to handle shopper authentication.
 * It is responsible for initializing shopper session, manage access
 * and refresh tokens on server/browser environments. As well as providing
 * a mechanism to queue network calls before having a valid access token.
 *
 * @Internal
 */
class Auth {
    private client: ShopperLogin<ApiClientConfigParams>
    private shopperCustomersClient: ShopperCustomers<ApiClientConfigParams>
    private redirectURI: string
    private pendingToken: Promise<TokenResponse> | undefined
    private stores: Record<StorageType, BaseStorage>
    private fetchedToken: string
    private clientSecret: string
    private silenceWarnings: boolean
    private logger: Logger
    private defaultDnt: boolean | undefined
    private isPrivate: boolean
    private passwordlessLoginCallbackURI: string
    private refreshTokenRegisteredCookieTTL: number | undefined
    private refreshTokenGuestCookieTTL: number | undefined
    private refreshTrustedAgentHandler:
        | ((loginId: string, usid: string, refresh: boolean) => Promise<TokenResponse>)
        | undefined

    constructor(config: AuthConfig) {
        // Special endpoint for injecting SLAS private client secret.
        const baseUrl = config.proxy.split(MOBIFY_PATH)[0]
        const privateClientEndpoint = `${baseUrl}${SLAS_PRIVATE_PROXY_PATH}`

        this.client = new ShopperLogin({
            proxy: config.enablePWAKitPrivateClient ? privateClientEndpoint : config.proxy,
            parameters: {
                clientId: config.clientId,
                organizationId: config.organizationId,
                shortCode: config.shortCode,
                siteId: config.siteId
            },
            throwOnBadResponse: true,
            // We need to set credentials to 'same-origin' to allow cookies to be set.
            // This is required as SLAS calls return a dwsid cookie for hybrid sites.
            // The dwsid value is then passed to the SCAPI as a header maintain the server affinity.
            fetchOptions: {
                credentials: 'same-origin',
                ...config.fetchOptions
            }
        })
        this.shopperCustomersClient = new ShopperCustomers({
            proxy: config.proxy,
            parameters: {
                clientId: config.clientId,
                organizationId: config.organizationId,
                shortCode: config.shortCode,
                siteId: config.siteId
            },
            throwOnBadResponse: true,
            fetchOptions: config.fetchOptions
        })

        const options = {
            keySuffix: config.siteId,
            // Setting this to true on the server allows us to reuse guest auth tokens across lambda runs
            sharedContext: !onClient()
        }

        this.stores = {
            cookie: onClient() ? new CookieStorage(options) : new MemoryStorage(options),
            local: onClient() ? new LocalStorage(options) : new MemoryStorage(options),
            memory: new MemoryStorage(options)
        }

        this.redirectURI = config.redirectURI

        this.fetchedToken = config.fetchedToken || ''

        this.logger = config.logger

        this.defaultDnt = config.defaultDnt

        this.refreshTokenRegisteredCookieTTL = config.refreshTokenRegisteredCookieTTL

        this.refreshTokenGuestCookieTTL = config.refreshTokenGuestCookieTTL

        /*
         * There are 2 ways to enable SLAS private client mode.
         * If enablePWAKitPrivateClient=true, we route SLAS calls to /mobify/slas/private
         * and set an internal placeholder as the client secret. The proxy will override the placeholder
         * with the actual client secret so any truthy value as the placeholder works here.
         *
         * If enablePWAKitPrivateClient=false and clientSecret is provided as a non-empty string,
         * private client mode is enabled but we don't route calls to /mobify/slas/private
         * This is how non-PWA Kit consumers of commerce-sdk-react can enable private client and set a secret
         *
         * If both enablePWAKitPrivateClient and clientSecret are truthy, enablePWAKitPrivateClient takes
         * priority and we ignore whatever was set for clientSecret. This prints a warning about the clientSecret
         * being ignored.
         *
         * If both enablePWAKitPrivateClient and clientSecret are falsy, we are in SLAS public client mode.
         */
        if (config.enablePWAKitPrivateClient && config.clientSecret) {
            this.logWarning(SLAS_SECRET_OVERRIDE_MSG)
        }
        this.clientSecret = config.enablePWAKitPrivateClient
            ? // PWA proxy is enabled, assume project is PWA and that the proxy will handle setting the secret
              // We can pass any truthy value here to satisfy commerce-sdk-isomorphic requirements
              SLAS_SECRET_PLACEHOLDER
            : // We think there are users of Commerce SDK React and Commerce SDK isomorphic outside of PWA
              // For these users to use a private client, they must have some way to set a client secret
              // PWA users should not need to touch this.
              config.clientSecret || ''

        this.silenceWarnings = config.silenceWarnings || false

        this.isPrivate = !!this.clientSecret

        const passwordlessLoginCallbackURI = config.passwordlessLoginCallbackURI
        this.passwordlessLoginCallbackURI = passwordlessLoginCallbackURI
            ? isAbsoluteUrl(passwordlessLoginCallbackURI)
                ? passwordlessLoginCallbackURI
                : `${baseUrl}${passwordlessLoginCallbackURI}`
            : ''
    }

    get(name: AuthDataKeys) {
        const {key, storageType} = DATA_MAP[name]
        const storage = this.stores[storageType]
        return storage.get(key)
    }

    private set(name: AuthDataKeys, value: string, options?: unknown) {
        const {key, storageType} = DATA_MAP[name]
        const storage = this.stores[storageType]
        storage.set(key, value, options)
        DATA_MAP[name].callback?.(storage)
    }

    private delete(name: AuthDataKeys) {
        const {key, storageType} = DATA_MAP[name]
        const storage = this.stores[storageType]
        storage.delete(key)
    }

    /**
     * Return the value of the DNT cookie or undefined if it is not set.
     * The DNT cookie being undefined means that there is a necessity to
     * get the user's input for consent tracking, but not that there is no
     * DNT value to apply to analytics layers. DNT value will default to
     * a certain value and this is reflected by effectiveDnt.
     *
     * If the cookie value is invalid, then it will be deleted in this function.
     *
     * If includeDefaults is true, then even if the cookie is not defined,
     * defaultDnt will be returned, if it exists. If defaultDnt is not defined, then
     * the SDK Default will return (false)
     */
    getDnt(options?: DntOptions) {
        const dntCookieVal = this.get(DNT_COOKIE_NAME)
        let dntCookieStatus = undefined
        const accessToken = this.getAccessToken()
        let isInSync = true
        if (accessToken) {
            const {dnt} = this.parseSlasJWT(accessToken)
            isInSync = dnt === dntCookieVal
        }
        if ((dntCookieVal !== '1' && dntCookieVal !== '0') || !isInSync) {
            this.delete(DNT_COOKIE_NAME)
        } else {
            dntCookieStatus = Boolean(Number(dntCookieVal))
        }

        if (options?.includeDefaults) {
            const defaultDnt = this.defaultDnt

            let effectiveDnt
            const dntCookie = dntCookieVal === '1' ? true : dntCookieVal === '0' ? false : undefined
            if (dntCookie !== undefined) {
                effectiveDnt = dntCookie
            } else {
                // If the cookie is not set, read the defaultDnt preference.
                // If defaultDnt doesn't exist, default to false, following SLAS default for dnt
                effectiveDnt = defaultDnt !== undefined ? defaultDnt : false
            }

            return effectiveDnt
        }

        return dntCookieStatus
    }

    async setDnt(preference: boolean | null) {
        let dntCookieVal = String(Number(preference))
        // Use defaultDNT if defined. If not, use SLAS default DNT
        if (preference === null) {
            dntCookieVal = this.defaultDnt ? String(Number(this.defaultDnt)) : '0'
        }
        // Set the cookie once to include dnt in the access token and then again to set the expiry time
        this.set(DNT_COOKIE_NAME, dntCookieVal, {
            ...getDefaultCookieAttributes(),
            secure: true
        })
        const accessToken = this.getAccessToken()
        if (accessToken !== '') {
            const {dnt} = this.parseSlasJWT(accessToken)
            if (dnt !== dntCookieVal) {
                await this.refreshAccessToken()
            }
        } else {
            await this.refreshAccessToken()
        }
        if (preference !== null) {
            const SECONDS_IN_DAY = 86400
            this.set(DNT_COOKIE_NAME, dntCookieVal, {
                ...getDefaultCookieAttributes(),
                secure: true,
                expires: Number(this.get('refresh_token_expires_in')) / SECONDS_IN_DAY
            })
        }
    }

    private clearStorage() {
        // Type assertion because Object.keys is silly and limited :(
        const keys = Object.keys(DATA_MAP) as AuthDataKeys[]
        keys.forEach((keyName) => {
            const {key, storageType} = DATA_MAP[keyName]
            const store = this.stores[storageType]
            store.delete(key)
        })
    }

    /**
     * Every method in this class that returns a `TokenResponse` constructs it via this getter.
     */
    private get data(): AuthData {
        return {
            access_token: this.get('access_token'),
            customer_id: this.get('customer_id'),
            enc_user_id: this.get('enc_user_id'),
            expires_in: parseInt(this.get('expires_in')),
            id_token: this.get('id_token'),
            idp_access_token: this.get('idp_access_token'),
            refresh_token: this.get('refresh_token_registered') || this.get('refresh_token_guest'),
            token_type: this.get('token_type'),
            usid: this.get('usid'),
            customer_type: this.get('customer_type') as CustomerType,
            refresh_token_expires_in: this.get('refresh_token_expires_in')
        }
    }

    /**
     * Used to validate JWT token expiration.
     */
    private isTokenExpired(token: string) {
        const {exp, iat} = jwtDecode<JWTHeaders>(token.replace('Bearer ', ''))
        const validTimeSeconds = exp - iat - 60
        const tokenAgeSeconds = Date.now() / 1000 - iat
        return validTimeSeconds <= tokenAgeSeconds
    }

    /**
     * Returns the SLAS access token or an empty string if the access token
     * is not found in local store or if SFRA wants PWA to trigger refresh token login.
     *
     * On PWA-only sites, this returns the access token from local storage.
     * On Hybrid sites, this checks whether SFRA has sent an auth token via cookies.
     * Returns an access token from SFRA if it exist.
     * If not, the access token from local store is returned.
     *
     * This is only used within this Auth module since other modules consider the access
     * token from this.get('access_token') to be the source of truth.
     *
     * @returns {string} access token
     */
    private getAccessToken() {
        let accessToken = this.get('access_token')
        const sfraAuthToken = this.get('access_token_sfra')

        if (sfraAuthToken) {
            /*
             * If SFRA sends 'refresh', we return an empty token here so PWA can trigger a login refresh
             * This key is used when logout is triggered in SFRA but the redirect after logout
             * sends the user to PWA.
             */
            if (sfraAuthToken === 'refresh') {
                this.set('access_token', '')
                this.clearSFRAAuthToken()
                return ''
            }
            const {isGuest, customerId, usid} = this.parseSlasJWT(sfraAuthToken)
            this.set('access_token', sfraAuthToken)
            this.set('customer_id', customerId)
            this.set('usid', usid)
            this.set('customer_type', isGuest ? 'guest' : 'registered')

            accessToken = sfraAuthToken
            // SFRA -> PWA access token cookie handoff is successful so we clear the SFRA made cookies.
            // We don't want these cookies to persist and continue overriding what is in local store.
            this.clearSFRAAuthToken()
        }

        return accessToken
    }

    /**
     * For Hybrid storefronts ONLY!!!
     * This method clears out SLAS access token generated in Plugin SLAS and passed in via "cc-at" cookie.
     *
     * In a hybrid setup, whenever any SLAS flow executes in Plugin SLAS and an access token is generated,
     * the access token is sent over to PWA Kit using cc-at cookie.
     *
     * PWA Kit will check to see if cc-at cookie exists, if it does, the access token value in localStorage is updated
     * with value from the cc-at cookie and is then used for all SCAPI requests made from PWA Kit. The cc-at cookie is then cleared.
     */
    private clearSFRAAuthToken() {
        const {key, storageType} = DATA_MAP['access_token_sfra']
        const store = this.stores[storageType]
        store.delete(key)
    }

    /**
     * For Hybrid storefronts ONLY!!!
     * This method clears the dwsid cookie from the browser.
     * In a hybrid setup, dwsid points to an ECOM session and is passed between PWA Kit and SFRA/SG sites via "dwsid" cookie.
     *
     * Whenever a registered shopper logs in on PWA Kit, we must clear the dwsid cookie if one exists. When shopper navigates
     * to SFRA as a logged-in shopper, ECOM notices a missing DWSID, generates a new DWSID and triggers the onSession hook which uses
     * registered shopper refresh-token and restores session and basket on SFRA.
     */
    private clearECOMSession() {
        const {key, storageType} = DATA_MAP[DWSID_COOKIE_NAME]
        const store = this.stores[storageType]
        store.delete(key)
    }

    /**
     * Converts a duration in seconds to a Date object.
     * This function takes a number representing seconds and returns a Date object
     * for the current time plus the given duration.
     *
     * @param {number} seconds - The number of seconds to add to the current time.
     * @returns {Date} A Date object for the expiration time.
     */
    private convertSecondsToDate(seconds: number): Date {
        if (typeof seconds !== 'number') {
            throw new Error('The refresh_token_expires_in seconds parameter must be a number.')
        }
        return new Date(Date.now() + seconds * 1000)
    }

    /**
     * Retrieves our refresh token cookie ttl value
     */
    private getRefreshTokenCookieTTLValue(
        overrideValue: number | undefined,
        responseValue: number | undefined,
        defaultValue: number
    ): number {
        // Check if overrideValue is valid
        // if not, log warning and fall back to responseValue or defaultValue
        const isOverrideValid =
            typeof overrideValue === 'number' && overrideValue > 0 && overrideValue <= defaultValue
        if (!isOverrideValid && overrideValue !== undefined) {
            this.logWarning(SLAS_REFRESH_TOKEN_COOKIE_TTL_OVERRIDE_MSG)
        }

        // Return the first valid value: overrideValue (if valid), responseValue, or defaultValue
        return isOverrideValid ? overrideValue : responseValue || defaultValue
    }

    /**
     * This method stores the TokenResponse object retrieved from SLAS, and
     * store the data in storage.
     */
    private handleTokenResponse(res: TokenResponse, isGuest: boolean) {
        // Delete the SFRA auth token cookie if it exists
        this.clearSFRAAuthToken()
        this.set('access_token', res.access_token)
        this.set('customer_id', res.customer_id)
        this.set('enc_user_id', res.enc_user_id)
        this.set('expires_in', `${res.expires_in}`)
        this.set('id_token', res.id_token)
        this.set('idp_access_token', res.idp_access_token)
        this.set('token_type', res.token_type)
        this.set('usid', res.usid)
        this.set('customer_type', isGuest ? 'guest' : 'registered')

        const refreshTokenKey = isGuest ? 'refresh_token_guest' : 'refresh_token_registered'
        const overrideValue = isGuest
            ? this.refreshTokenGuestCookieTTL
            : this.refreshTokenRegisteredCookieTTL
        const responseValue = res.refresh_token_expires_in as number | undefined
        const defaultValue = isGuest
            ? DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
            : DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL
        const refreshTokenTTLValue = this.getRefreshTokenCookieTTLValue(
            overrideValue,
            responseValue,
            defaultValue
        )
        if (res.access_token) {
            const {uido} = this.parseSlasJWT(res.access_token)
            this.set('uido', uido)
        }
        const expiresDate = this.convertSecondsToDate(refreshTokenTTLValue)
        this.set('refresh_token_expires_in', refreshTokenTTLValue.toString())
        this.set(refreshTokenKey, res.refresh_token, {
            expires: expiresDate
        })
    }

    async refreshAccessToken() {
        const dntPref = this.getDnt({includeDefaults: true})
        const refreshTokenRegistered = this.get('refresh_token_registered')
        const refreshTokenGuest = this.get('refresh_token_guest')
        const refreshToken = refreshTokenRegistered || refreshTokenGuest
        if (refreshToken) {
            try {
                return await this.queueRequest(
                    () =>
                        helpers.refreshAccessToken(
                            this.client,
                            {
                                refreshToken,
                                dnt: dntPref
                            },
                            {
                                clientSecret: this.clientSecret
                            }
                        ),
                    !!refreshTokenGuest
                )
            } catch (error) {
                // If the refresh token is invalid, we need to re-login the user
                if (error instanceof Error && 'response' in error) {
                    // commerce-sdk-isomorphic throws a `ResponseError`, but doesn't export the class.
                    // We can't use `instanceof`, so instead we just check for the `response` property
                    // and assume it is a fetch Response.
                    const json = await (error['response'] as Response).json()
                    if (json.message === 'invalid refresh_token') {
                        // clean up storage and restart the login flow
                        this.clearStorage()
                    }
                }
            }
        }

        // refresh flow for TAOB
        const accessToken = this.getAccessToken()
        if (accessToken && this.isTokenExpired(accessToken)) {
            try {
                const {isGuest, usid, loginId, isAgent} = this.parseSlasJWT(accessToken)
                if (isAgent) {
                    return await this.queueRequest(
                        () => this.refreshTrustedAgent(loginId, usid),
                        isGuest
                    )
                }
            } catch (e) {
                /* catch invalid jwt */
            }
        }

        // if a TAOB left a usid and it tries to
        // use it, we will be stuck in a fail loop
        let token
        try {
            token = await this.loginGuestUser()
        } catch (e) {
            this.clearStorage()
            token = await this.loginGuestUser()
        }
        return token
    }

    /**
     * This method queues the requests and handles the SLAS token response.
     *
     * It returns the queue.
     *
     * @Internal
     */
    async queueRequest(fn: () => Promise<TokenResponse>, isGuest: boolean) {
        const queue = this.pendingToken ?? Promise.resolve()
        this.pendingToken = queue
            .then(async () => {
                const token = await fn()
                this.handleTokenResponse(token, isGuest)
                // Q: Why don't we just return token? Why re-construct the same object again?
                // A: because a user could open multiple tabs and the data in memory could be out-dated
                // We must always grab the data from the storage (cookie/localstorage) directly
                return this.data
            })
            .finally(() => {
                this.pendingToken = undefined
            })
        return await this.pendingToken
    }

    logWarning = (msg: string) => {
        if (!this.silenceWarnings) {
            this.logger.warn(msg)
        }
    }

    /**
     * This method extracts the status and message from a ResponseError that is returned
     * by commerce-sdk-isomorphic.
     *
     * commerce-sdk-isomorphic throws a `ResponseError`, but doesn't export the class.
     * We can't use `instanceof`, so instead we just check for the `response` property
     * and assume it is a `ResponseError` if a response is present
     *
     * Once commerce-sdk-isomorphic exports `ResponseError` we can revisit if this method is
     * still required.
     *
     * @returns {status_code, responseMessage} contained within the ResponseError
     * @throws error if the error is not a ResponseError
     * @Internal
     */
    extractResponseError = async (error: Error) => {
        // the regular error.message will return only the generic status code message
        // ie. 'Bad Request' for 400. We need to drill specifically into the ResponseError
        // to get a more descriptive error message from SLAS
        if ('response' in error) {
            const json = await (error['response'] as Response).json()
            const status_code: string = json.status_code
            const responseMessage: string = json.message

            return {
                status_code,
                responseMessage
            }
        }
        throw error
    }

    /**
     * The ready function returns a promise that resolves with valid ShopperLogin
     * token response.
     *
     * When this method is called for the very first time, it initializes the session
     * by following the public client auth flow to get access token for the user.
     * The flow:
     * 1. If we have valid access token - use it
     * 2. If we have valid refresh token - refresh token flow
     * 3. If we have valid TAOB access token - refresh TAOB token flow
     * 4. PKCE flow
     */
    async ready() {
        if (this.fetchedToken && this.fetchedToken !== '') {
            const {isGuest, customerId, usid} = this.parseSlasJWT(this.fetchedToken)
            this.set('access_token', this.fetchedToken)
            this.set('customer_id', customerId)
            this.set('usid', usid)
            this.set('customer_type', isGuest ? 'guest' : 'registered')
            return this.data
        }
        if (this.pendingToken) {
            return await this.pendingToken
        }

        const accessToken = this.getAccessToken()
        if (accessToken && !this.isTokenExpired(accessToken)) {
            return this.data
        }

        return await this.refreshAccessToken()
    }

    /**
     * Creates a function that only executes after a session is initialized.
     * @param fn Function that needs to wait until the session is initialized.
     * @returns Wrapped function
     */
    whenReady<Args extends unknown[], Data>(
        fn: (...args: Args) => Promise<Data>
    ): (...args: Args) => Promise<Data> {
        return async (...args) => {
            await this.ready()
            return await fn(...args)
        }
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginGuestUser.
     *
     */
    async loginGuestUser(parameters?: helpers.CustomQueryParameters) {
        if (this.clientSecret && onClient() && this.clientSecret !== SLAS_SECRET_PLACEHOLDER) {
            this.logWarning(SLAS_SECRET_WARNING_MSG)
        }
        const usid = this.get('usid')
        const dntPref = this.getDnt({includeDefaults: true})
        const isGuest = true
        const guestPrivateArgs = [
            this.client,
            {
                dnt: dntPref,
                ...(usid && {usid})
            },
            {clientSecret: this.clientSecret}
        ] as const
        const guestPublicArgs = [
            this.client,
            {
                redirectURI: this.redirectURI,
                dnt: dntPref,
                ...(usid && {usid}),
                // custom parameters are sent only into the /authorize endpoint.
                ...parameters
            }
        ] as const
        const callback = this.clientSecret
            ? () => helpers.loginGuestUserPrivate(...guestPrivateArgs)
            : () => helpers.loginGuestUser(...guestPublicArgs)

        try {
            return await this.queueRequest(callback, isGuest)
        } catch (error) {
            // We catch the error here to do logging but we still need to
            // throw an error to stop the login flow from continuing.
            const {status_code, responseMessage} = await this.extractResponseError(error as Error)
            this.logger.error(`${status_code} ${responseMessage}`)
            throw new Error(
                `New guest user could not be logged in. ${status_code} ${responseMessage}`
            )
        }
    }

    /**
     * This is a wrapper method for ShopperCustomer API registerCustomer endpoint.
     *
     */
    async register(body: ShopperCustomersTypes.CustomerRegistration) {
        const {customer, password, ...parameters} = body
        const {login} = customer
        const customParameters = extractCustomParameters(parameters)

        // login is optional field from isomorphic library
        // type CustomerRegistration
        // here we had to guard it to avoid ts error
        if (!login) {
            throw new Error('Customer registration is missing login field.')
        }

        // The registerCustomer endpoint currently does not support custom parameters
        // so we make sure not to send any custom params here
        const res = await this.shopperCustomersClient.registerCustomer({
            headers: {
                authorization: `Bearer ${this.get('access_token')}`
            },
            body: {
                customer,
                password
            }
        })
        await this.loginRegisteredUserB2C({
            username: login,
            password,
            options: {
                body: customParameters
            }
        })
        return res
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginRegisteredUserB2C.
     *
     * Note: This uses the type LoginRegisteredUserCredentialsWithCustomParams rather than LoginRegisteredUserB2CCredentials
     * as a workaround to allow custom parameters through because the login.mutateAsync hook will only pass through a single
     * 'body' argument into this function.
     *
     * In the next major version release, we should modify this method so that it's input is a body containing credentials,
     * similar to the input for the register function.
     */
    async loginRegisteredUserB2C(credentials: LoginRegisteredUserCredentialsWithCustomParams) {
        if (this.clientSecret && onClient() && this.clientSecret !== SLAS_SECRET_PLACEHOLDER) {
            this.logWarning(SLAS_SECRET_WARNING_MSG)
        }
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const dntPref = this.getDnt({includeDefaults: true})
        const isGuest = false
        const token = await helpers.loginRegisteredUserB2C(
            this.client,
            {
                username: credentials.username,
                password: credentials.password,
                clientSecret: this.clientSecret
            },
            {
                redirectURI,
                dnt: dntPref,
                ...(usid && {usid})
            },
            credentials.options
        )
        this.handleTokenResponse(token, isGuest)
        if (onClient()) {
            void this.clearECOMSession()
        }
        return token
    }

    /**
     * Trusted agent authorization
     *
     * @warning This method is not supported on the server, it is a client-only method.
     */
    async authorizeTrustedAgent(credentials: {loginId?: string}) {
        const slasClient = this.client
        const codeVerifier = helpers.createCodeVerifier()
        const codeChallenge = await helpers.generateCodeChallenge(codeVerifier)
        const organizationId = slasClient.clientConfig.parameters.organizationId
        const clientId = slasClient.clientConfig.parameters.clientId
        const siteId = slasClient.clientConfig.parameters.siteId
        const loginId = credentials.loginId || 'guest'
        const isGuest = loginId === 'guest'
        const idpOrigin = isGuest ? 'slas' : 'ecom'

        const url = `${
            slasClient.clientConfig.proxy || ''
        }/shopper/auth/v1/organizations/${organizationId}/oauth2/trusted-agent/authorize?${[
            ...[
                `client_id=${clientId}`,
                `channel_id=${siteId}`,
                `login_id=${loginId}`,
                `redirect_uri=${this.redirectURI}`,
                `idp_origin=${idpOrigin}`,
                `response_type=code`
            ],
            ...(!this.clientSecret ? [`code_challenge=${codeChallenge}`] : [])
        ].join('&')}`

        return {url, codeVerifier}
    }

    /**
     * Trusted agent login
     *
     * @warning This method is not supported on the server, it is a client-only method.
     */
    async loginTrustedAgent(credentials: {
        loginId?: string
        code: string
        codeVerifier?: string
        usid?: string
        state?: string
        clientSecret?: string
    }) {
        const slasClient = this.client
        const loginId = credentials.loginId || 'guest'
        const isGuest = loginId === 'guest'
        const idpOrigin = isGuest ? 'slas' : 'ecom'

        const optionsToken = {
            headers: {
                Authorization: `Bearer ${credentials.code}`
            },
            body: {
                channel_id: slasClient.clientConfig.parameters.siteId,
                grant_type: 'client_credentials',
                redirect_uri: this.redirectURI,
                login_id: loginId,
                idp_origin: idpOrigin,
                dnt: 'true',
                ...(!this.clientSecret && {
                    client_id: slasClient.clientConfig.parameters.clientId,
                    code_verifier: credentials.codeVerifier
                }),
                ...(credentials.state && {state: credentials.state}),
                ...(credentials.usid && {usid: credentials.usid})
            }
        } as {headers: {[key: string]: string}; body: TrustedAgentTokenRequest}

        // using slas private client
        if (credentials.clientSecret) {
            optionsToken.headers._sfdc_client_auth = `Basic ${helpers.stringToBase64(
                `${slasClient.clientConfig.parameters.clientId}:${credentials.clientSecret}`
            )}`
        }

        const token = await slasClient.getTrustedAgentAccessToken(optionsToken)
        this.handleTokenResponse(token, isGuest)

        return token
    }
    /**
     * Trusted agent refresh handler
     *
     * @warning This method is not supported on the server, it is a client-only method.
     */
    registerTrustedAgentRefreshHandler(
        refreshTrustedAgentHandler: (
            loginId?: string,
            usid?: string,
            refresh?: boolean
        ) => Promise<TokenResponse>
    ) {
        this.refreshTrustedAgentHandler = refreshTrustedAgentHandler
    }

    async refreshTrustedAgent(loginId: string, usid: string): Promise<TokenResponse> {
        if (this.refreshTrustedAgentHandler) {
            return await this.refreshTrustedAgentHandler(loginId, usid, true)
        }

        this.clearStorage()
        return await this.loginGuestUser()
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: logout.
     *
     */
    async logout() {
        if (this.get('customer_type') === 'registered') {
            // Not awaiting on purpose because there isn't much we can do if this fails.
            void helpers.logout(this.client, {
                accessToken: this.get('access_token'),
                refreshToken: this.get('refresh_token_registered')
            })
        }
        this.clearStorage()
        return await this.ready()
    }

    /**
     * Handle updating customer password and re-log in after the access token is invalidated.
     *
     */
    async updateCustomerPassword(body: {
        customer: ShopperCustomersTypes.Customer
        password: string
        currentPassword: string
        shouldReloginCurrentSession?: boolean
    }) {
        const {
            customer: {customerId, login},
            password,
            currentPassword,
            shouldReloginCurrentSession
        } = body

        // login and customerId are optional fields on the Customer type
        // here we had to guard it to avoid ts error
        if (!login || !customerId) {
            throw new Error('Customer is missing required fields.')
        }

        const res = await this.shopperCustomersClient.updateCustomerPassword({
            headers: {
                authorization: `Bearer ${this.get('access_token')}`
            },
            parameters: {customerId},
            body: {
                password: password,
                currentPassword: currentPassword
            }
        })

        if (shouldReloginCurrentSession) {
            await this.loginRegisteredUserB2C({
                username: login,
                password
            })
        }
        return res
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: authorizeIDP.
     *
     */
    async authorizeIDP(parameters: AuthorizeIDPParams) {
        const redirectURI = parameters.redirectURI || this.redirectURI
        const usid = this.get('usid')
        const customParameters = extractCustomParameters(parameters)
        const {url, codeVerifier} = await helpers.authorizeIDP(
            this.client,
            {
                redirectURI,
                hint: parameters.hint,
                ...(usid && {usid}),
                ...customParameters
            },
            this.isPrivate
        )

        if (onClient()) {
            window.location.assign(url)
        } else {
            console.warn('Something went wrong, this client side method is invoked on the server.')
        }
        this.set('code_verifier', codeVerifier)
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginIDPUser.
     *
     */
    async loginIDPUser(parameters: LoginIDPUserParams) {
        const codeVerifier = this.get('code_verifier')
        const code = parameters.code
        const usid = parameters.usid || this.get('usid')
        const redirectURI = parameters.redirectURI || this.redirectURI
        const dntPref = this.getDnt({includeDefaults: true})

        const token = await helpers.loginIDPUser(
            this.client,
            {
                codeVerifier,
                clientSecret: this.clientSecret
            },
            {
                redirectURI,
                code,
                dnt: dntPref,
                ...(usid && {usid})
            }
        )
        const isGuest = false
        this.handleTokenResponse(token, isGuest)
        // Delete the code verifier once the user has logged in
        this.delete('code_verifier')
        if (onClient()) {
            void this.clearECOMSession()
        }
        return token
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: authorizePasswordless.
     */
    async authorizePasswordless(parameters: AuthorizePasswordlessParams) {
        const userid = parameters.userid
        const callbackURI = parameters.callbackURI || this.passwordlessLoginCallbackURI
        const usid = this.get('usid')
        const mode = callbackURI ? 'callback' : 'sms'

        const res = await helpers.authorizePasswordless(
            this.client,
            {
                clientSecret: this.clientSecret
            },
            {
                ...(callbackURI && {callbackURI: callbackURI}),
                ...(usid && {usid}),
                userid,
                mode
            }
        )
        if (res && res.status !== 200) {
            const errorData = await res.json()
            throw new Error(`${res.status} ${String(errorData.message)}`)
        }
        return res
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: getPasswordLessAccessToken.
     */
    async getPasswordLessAccessToken(parameters: LoginPasswordlessParams) {
        const pwdlessLoginToken = parameters.pwdlessLoginToken
        const dntPref = this.getDnt({includeDefaults: true})
        const token = await helpers.getPasswordLessAccessToken(
            this.client,
            {
                clientSecret: this.clientSecret
            },
            {
                pwdlessLoginToken,
                dnt: dntPref !== undefined ? String(dntPref) : undefined
            }
        )
        const isGuest = false
        this.handleTokenResponse(token, isGuest)
        if (onClient()) {
            void this.clearECOMSession()
        }
        return token
    }

    /**
     * A wrapper method for the SLAS endpoint: getPasswordResetToken.
     *
     */
    async getPasswordResetToken(parameters: ShopperLoginTypes.PasswordActionRequest) {
        const slasClient = this.client
        const callbackURI = parameters.callback_uri

        const options = {
            headers: {
                Authorization: ''
            },
            body: {
                user_id: parameters.user_id,
                mode: 'callback',
                channel_id: slasClient.clientConfig.parameters.siteId,
                client_id: slasClient.clientConfig.parameters.clientId,
                callback_uri: callbackURI,
                hint: 'cross_device'
            }
        }

        // Only set authorization header if using private client
        if (this.clientSecret) {
            options.headers.Authorization = `Basic ${stringToBase64(
                `${slasClient.clientConfig.parameters.clientId}:${this.clientSecret}`
            )}`
        }

        const res = await slasClient.getPasswordResetToken(options)
        return res
    }

    /**
     * A wrapper method for the SLAS endpoint: resetPassword.
     *
     */
    async resetPassword(parameters: ShopperLoginTypes.PasswordActionVerifyRequest) {
        const slasClient = this.client
        const options = {
            headers: {
                Authorization: ''
            },
            body: {
                pwd_action_token: parameters.pwd_action_token,
                channel_id: slasClient.clientConfig.parameters.siteId,
                client_id: slasClient.clientConfig.parameters.clientId,
                new_password: parameters.new_password,
                user_id: parameters.user_id
            }
        }

        // Only set authorization header if using private client
        if (this.clientSecret) {
            options.headers.Authorization = `Basic ${stringToBase64(
                `${slasClient.clientConfig.parameters.clientId}:${this.clientSecret}`
            )}`
        }
        // TODO: no code verifier needed with the fix blair has made, delete this when the fix has been merged to production
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const res = await this.client.resetPassword(options)
        return res
    }

    /**
     * Decode SLAS JWT and extract information such as customer id, usid, etc.
     *
     */
    parseSlasJWT(jwt: string) {
        const payload: SlasJwtPayload = jwtDecode(jwt)
        const {sub, isb, dnt} = payload

        if (!sub || !isb) {
            throw new Error('Unable to parse access token payload: missing sub and isb.')
        }

        // ISB format
        // 'uido:ecom::upn:Guest||xxxEmailxxx::uidn:FirstName LastName::gcid:xxxGuestCustomerIdxxx::rcid:xxxRegisteredCustomerIdxxx::chid:xxxSiteIdxxx',
        const isbParts = isb.split('::')
        const uido = isbParts[0].split('uido:')[1]
        const isGuest = isbParts[1] === 'upn:Guest'
        const customerId = isGuest
            ? isbParts[3].replace('gcid:', '')
            : isbParts[4].replace('rcid:', '')

        const loginId = isGuest ? 'guest' : isbParts[1].replace('upn:', '')

        const isAgent = !!isbParts?.[isGuest ? 5 : 6]?.startsWith('agent:')
        const agentId = isAgent ? isbParts?.[isGuest ? 5 : 6]?.replace('agent:', '') : null

        // SUB format
        // cc-slas::zzrf_001::scid:c9c45bfd-0ed3-4aa2-xxxx-40f88962b836::usid:b4865233-de92-4039-xxxx-aa2dfc8c1ea5
        const usid = sub.split('::')[3].replace('usid:', '')
        return {
            isGuest,
            customerId,
            usid,
            dnt,
            loginId,
            isAgent,
            agentId,
            uido
        }
    }
}

export default Auth
