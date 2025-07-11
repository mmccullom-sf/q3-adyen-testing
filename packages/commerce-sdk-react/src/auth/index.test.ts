/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Auth, {AuthData} from './'
import {waitFor} from '@testing-library/react'
import jwt from 'jsonwebtoken'
import {
    helpers,
    ShopperCustomersTypes,
    ShopperCustomers,
    ShopperLogin
} from 'commerce-sdk-isomorphic'
import * as utils from '../utils'
import {SLAS_SECRET_PLACEHOLDER} from '../constant'
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import {
    DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL,
    DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
} from './index'
import {ApiClientConfigParams, RequireKeys} from '../hooks/types'

const baseCustomer: RequireKeys<ShopperCustomersTypes.Customer, 'login'> = {
    customerId: 'customerId',
    login: 'test@test.com'
}

// Use memory storage for all our storage types.
jest.mock('./storage', () => {
    const originalModule = jest.requireActual('./storage')

    return {
        ...originalModule,
        CookieStorage: originalModule.MemoryStorage,
        LocalStorage: originalModule.MemoryStorage
    }
})

jest.mock('commerce-sdk-isomorphic', () => {
    const originalModule = jest.requireActual('commerce-sdk-isomorphic')

    return {
        ...originalModule,
        helpers: {
            refreshAccessToken: jest.fn().mockResolvedValue(''),
            loginGuestUser: jest.fn().mockResolvedValue(''),
            loginGuestUserPrivate: jest.fn().mockResolvedValue(''),
            loginRegisteredUserB2C: jest.fn().mockResolvedValue(''),
            logout: jest.fn().mockResolvedValue(''),
            handleTokenResponse: jest.fn().mockResolvedValue(''),
            loginIDPUser: jest.fn().mockResolvedValue(''),
            authorizeIDP: jest.fn().mockResolvedValue(''),
            authorizePasswordless: jest.fn().mockResolvedValue(''),
            getPasswordLessAccessToken: jest.fn().mockResolvedValue('')
        }
    }
})

jest.mock('../utils', () => {
    const originalModule = jest.requireActual('../utils')

    return {
        ...originalModule,
        __esModule: true,
        onClient: () => true,
        getParentOrigin: jest.fn().mockResolvedValue(''),
        isOriginTrusted: () => false,
        getDefaultCookieAttributes: () => {},
        isAbsoluteUrl: () => true
    }
})

/** The auth data we store has a slightly different shape than what we use. */
type StoredAuthData = Omit<AuthData, 'refresh_token'> & {refresh_token_guest?: string}

const config = {
    clientId: 'clientId',
    organizationId: 'organizationId',
    shortCode: 'shortCode',
    siteId: 'siteId',
    proxy: 'proxy',
    redirectURI: 'redirectURI',
    logger: console,
    passwordlessLoginCallbackURI: 'passwordlessLoginCallbackURI'
}

const configSLASPrivate = {
    ...config,
    enablePWAKitPrivateClient: true
}
const JWTNotExpired = jwt.sign(
    {
        exp: Math.floor(Date.now() / 1000) + 1000,
        sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:usid`,
        isb: `uido:ecom::upn:test@gmail.com::uidn:firstname lastname::gcid:guestuserid::rcid:rcid::chid:siteId`
    },
    'secret'
)
const JWTExpired = jwt.sign(
    {
        exp: Math.floor(Date.now() / 1000) - 1000,
        sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:usid`,
        isb: `uido:ecom::upn:test@gmail.com::uidn:firstname lastname::gcid:guestuserid::rcid:rcid::chid:siteId`
    },
    'secret'
)

const configPasswordlessSms = {
    clientId: 'clientId',
    organizationId: 'organizationId',
    shortCode: 'shortCode',
    siteId: 'siteId',
    proxy: 'proxy',
    redirectURI: 'redirectURI',
    logger: console
}

const FAKE_SLAS_EXPIRY = DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL - 1

const TOKEN_RESPONSE: ShopperLoginTypes.TokenResponse = {
    access_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYy1zbGFzOjp6enJmXzAwMTo6c2NpZDpjOWM0NWJmZC0wZWQzLTRhYTIteHh4eC00MGY4ODk2MmI4MzY6OnVzaWQ6YjQ4NjUyMzMtZGU5Mi00MDM5LXh4eHgtYWEyZGZjOGMxZWE1IiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJpc2IiOiJ1aWRvOmVjb206OnVwbjpHdWVzdHx8am9obi5kb2VAZXhhbXBsZS5jb206OnVpZG46Sm9obiBEb2U6OmdjaWQ6Z3Vlc3QtMTIzNDU6OnJjaWQ6cmVnaXN0ZXJlZC02Nzg5MCIsImRudCI6InRlc3QifQ.9yKtUb22ExO-Q4VNQRAyIgTm63l3x5z45Uu1FIQa5dQ',
    customer_id: 'customer_id_xyz',
    enc_user_id: 'enc_user_id_xyz',
    expires_in: 1800,
    id_token: 'id_token_xyz',
    refresh_token: 'refresh_token_xyz',
    token_type: 'token_type_abc',
    usid: 'usid_xyz',
    idp_access_token: 'idp_access_token_xyz',
    // test that this is authoritative and not set to
    // `DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL` when config.refreshTokenRegisteredCookieTTL is not set
    refresh_token_expires_in: FAKE_SLAS_EXPIRY
}

describe('Auth', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('get/set storage value', () => {
        const auth = new Auth(config)

        const refreshToken = 'test refresh token'
        const accessToken = 'test access token'
        // @ts-expect-error private method
        auth.set('refresh_token_guest', refreshToken)
        // @ts-expect-error private method
        auth.set('access_token', accessToken)
        expect(auth.get('refresh_token_guest')).toBe(refreshToken)
        expect(auth.get('access_token')).toBe(accessToken)
        // @ts-expect-error private property
        expect([...auth.stores['cookie'].map.keys()]).toEqual([`cc-nx-g_siteId`])
        // @ts-expect-error private property
        expect([...auth.stores['local'].map.keys()]).toEqual([`access_token_siteId`])
    })
    test('set registered refresh token will clear guest refresh token, vise versa', () => {
        const auth = new Auth(config)

        const refreshTokenGuest = 'guest'
        const refreshTokenRegistered = 'registered'
        // @ts-expect-error private method
        auth.set('refresh_token_guest', refreshTokenGuest)
        // @ts-expect-error private method
        auth.set('refresh_token_registered', refreshTokenRegistered)
        expect(auth.get('refresh_token_guest')).toBe('')
        // @ts-expect-error private method
        auth.set('refresh_token_guest', refreshTokenGuest)
        expect(auth.get('refresh_token_registered')).toBe('')
    })
    test('this.data returns the storage value', () => {
        const auth = new Auth(config)

        const sample: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: 'access_token',
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: FAKE_SLAS_EXPIRY
        }
        // Convert stored format to exposed format
        const result = {...sample, refresh_token: 'refresh_token_guest'}
        delete result.refresh_token_guest

        Object.keys(sample).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, sample[key])
        })
        // @ts-expect-error private method
        expect(auth.data).toEqual(result)
    })
    test('isTokenExpired', () => {
        const auth = new Auth(config)
        // @ts-expect-error private method
        expect(auth.isTokenExpired(JWTNotExpired)).toBe(false)
        // @ts-expect-error private method
        expect(auth.isTokenExpired(JWTExpired)).toBe(true)
        // @ts-expect-error private method
        expect(() => auth.isTokenExpired()).toThrow()
    })
    test('getAccessToken from local store', () => {
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token', 'token')
        // @ts-expect-error private method
        expect(auth.getAccessToken()).toBe('token')
    })
    test('use SFRA token over local store token if present', () => {
        const customerId = 'customerId'
        const customerType = 'guest'
        const customerTypeUpperCase = 'Guest'
        const usid = 'usid'
        const sfraJWT = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 1000,
                isb: `uido:slas::upn:${customerTypeUpperCase}::uidn:Guest User::gcid:${customerId}::chid:siteId`,
                sub: `cc-slas::realm::scid:scid::usid:${usid}`
            },
            'secret'
        )

        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token', 'token')
        // @ts-expect-error private method
        auth.set('access_token_sfra', sfraJWT)
        // @ts-expect-error private method
        expect(auth.getAccessToken()).toBe(sfraJWT)
        expect(auth.get('access_token_sfra')).toBeFalsy()

        // Check that local store is updated
        expect(auth.get('access_token')).toBe(sfraJWT)
        expect(auth.get('customer_id')).toBe(customerId)
        expect(auth.get('customer_type')).toBe(customerType)
        expect(auth.get('usid')).toBe(usid)
    })
    test('access token is cleared if SFRA sends refresh', () => {
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token', 'token')
        // @ts-expect-error private method
        auth.set('access_token_sfra', 'refresh')
        // @ts-expect-error private method
        expect(auth.getAccessToken()).toBeFalsy()
        expect(auth.get('access_token_sfra')).toBeFalsy()
    })
    test('clear SFRA auth tokens', () => {
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token_sfra', '123')
        // @ts-expect-error private method
        auth.clearSFRAAuthToken()

        expect(auth.get('access_token_sfra')).toBeFalsy()
    })
    test('site switch clears auth storage', () => {
        const auth = new Auth(config)
        // @ts-expect-error private method
        auth.set('access_token', '123')
        // @ts-expect-error private method
        auth.set('refresh_token_guest', '456')
        const switchSiteConfig = {...config, siteId: 'another site'}
        const newAuth = new Auth(switchSiteConfig)
        expect(newAuth.get('access_token')).not.toBe('123')
        expect(newAuth.get('refresh_token_guest')).not.toBe('456')
    })
    test('ready - re-use pendingToken', async () => {
        const auth = new Auth(config)
        const data = {
            refresh_token: 'refresh_token_guest',
            access_token: 'access_token',
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest'
        }
        // @ts-expect-error private method
        auth.pendingToken = Promise.resolve(data)

        await expect(auth.ready()).resolves.toEqual(data)
    })
    test('ready - re-use valid access token', async () => {
        const auth = new Auth(config)

        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: JWTNotExpired,
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: FAKE_SLAS_EXPIRY
        }
        // Convert stored format to exposed format
        const result = {...data, refresh_token: 'refresh_token_guest'}
        delete result.refresh_token_guest

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        await expect(auth.ready()).resolves.toEqual(result)
        // @ts-expect-error private method
        expect(auth.pendingToken).toBeUndefined()
    })
    test('ready - use `fetchedToken` and short circuit network request', async () => {
        const fetchedToken = jwt.sign(
            {
                sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:usid`,
                isb: `uido:ecom::upn:test@gmail.com::uidn:firstname lastname::gcid:guestuserid::rcid:rcid::chid:siteId`
            },
            'secret'
        )
        const auth = new Auth({...config, fetchedToken})
        jest.spyOn(auth, 'queueRequest')
        await auth.ready()
        // The "unbound method" isn't being called, so the rule isn't applicable
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(auth.queueRequest).not.toHaveBeenCalled()
        // @ts-expect-error private method
        expect(auth.pendingToken).toBeUndefined()
    })
    test('ready - use `fetchedToken` and auth data is populated for registered user', async () => {
        const usid = 'usidddddd'
        const customerId = 'customerIddddddd'
        const fetchedToken = jwt.sign(
            {
                sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:${usid}`,
                isb: `uido:ecom::upn:test@gmail.com::uidn:firstname lastname::gcid:guestuserid::rcid:${customerId}::chid:siteId`
            },
            'secret'
        )
        const auth = new Auth({...config, fetchedToken})
        await auth.ready()
        expect(auth.get('access_token')).toBe(fetchedToken)
        expect(auth.get('customer_id')).toBe(customerId)
        expect(auth.get('usid')).toBe(usid)
        expect(auth.get('customer_type')).toBe('registered')
    })
    test('ready - use `fetchedToken` and auth data is populated for guest user', async () => {
        // isb: `uido:slas::upn:Guest::uidn:Guest User::gcid:bclrdGlbIZlHaRxHsZlWYYxHwZ::chid: `
        const usid = 'usidddddd'
        const customerId = 'customerIddddddd'
        const fetchedToken = jwt.sign(
            {
                sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:${usid}`,
                isb: `uido:ecom::upn:Guest::uidn:firstname lastname::gcid:${customerId}::rcid:registeredCid::chid:siteId`
            },
            'secret'
        )
        const auth = new Auth({...config, fetchedToken})
        await auth.ready()
        expect(auth.get('access_token')).toBe(fetchedToken)
        expect(auth.get('customer_id')).toBe(customerId)
        expect(auth.get('usid')).toBe(usid)
        expect(auth.get('customer_type')).toBe('guest')
    })
    test('ready - use refresh token when access token is expired', async () => {
        const auth = new Auth(config)

        // To simulate real-world scenario, let's first test with a good valid token
        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: JWTNotExpired,
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: 'refresh_token_expires_in'
        }

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        await auth.ready()
        expect(helpers.refreshAccessToken).not.toHaveBeenCalled()

        // And then now test with an _expired_ token
        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)

        await auth.ready()
        expect(helpers.refreshAccessToken).toHaveBeenCalled()
    })

    test('ready - use refresh token when access token is expired with slas private client', async () => {
        const auth = new Auth(configSLASPrivate)

        // To simulate real-world scenario, let's first test with a good valid token
        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: JWTNotExpired,
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: 30 * 24 * 3600
        }

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        await auth.ready()
        expect(helpers.refreshAccessToken).not.toHaveBeenCalled()

        // And then now test with an _expired_ token
        // @ts-expect-error private method
        auth.set('access_token', JWTExpired)

        await auth.ready()
        expect(helpers.refreshAccessToken).toHaveBeenCalled()
        const funcArg = (helpers.refreshAccessToken as jest.Mock).mock.calls[0][2]
        expect(funcArg).toMatchObject({clientSecret: SLAS_SECRET_PLACEHOLDER})
    })
    test('ready - PKCE flow', async () => {
        const auth = new Auth(config)

        await auth.ready()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })
    test('ready - throw error and discard refresh token if refresh token is invalid', async () => {
        // Force the mock to throw just for this test
        const refreshAccessTokenSpy = jest.spyOn(helpers, 'refreshAccessToken')
        refreshAccessTokenSpy.mockRejectedValueOnce({
            response: {
                json: () => {
                    return {
                        status_code: 404,
                        message: 'test'
                    }
                }
            }
        })

        // To simulate real-world scenario, let's start with an expired access token
        const data: StoredAuthData = {
            refresh_token_guest: 'refresh_token_guest',
            access_token: JWTExpired,
            customer_id: 'customer_id',
            enc_user_id: 'enc_user_id',
            expires_in: 1800,
            id_token: 'id_token',
            idp_access_token: 'idp_access_token',
            token_type: 'token_type',
            usid: 'usid',
            customer_type: 'guest',
            refresh_token_expires_in: 30 * 24 * 3600
        }

        const auth = new Auth(config)

        Object.keys(data).forEach((key) => {
            // @ts-expect-error private method
            auth.set(key, data[key])
        })

        await auth.ready()

        // The call to loginGuestUser only executes when refreshAccessToken fails
        expect(refreshAccessTokenSpy).toHaveBeenCalled()
        expect(auth.get('refresh_token_guest')).toBe('')
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })

    test('loginGuestUser', async () => {
        const auth = new Auth(config)
        await auth.loginGuestUser()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })

    test('loginGuestUser can pass along custom parameters', async () => {
        const parameters = {c_test: 'custom parameter'}
        const auth = new Auth(config)
        await auth.loginGuestUser(parameters)
        // The first argument is the SLAS config, which we don't need to verify in this case
        // We only want to see that the custom parameters were included in the second argument
        expect(helpers.loginGuestUser).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({c_test: 'custom parameter'})
        )
    })

    test('register only sends custom parameters to registered login', async () => {
        const registerCustomerSpy = jest
            .spyOn(ShopperCustomers.prototype, 'registerCustomer')
            .mockImplementation()
        const auth = new Auth(config)
        const inputToRegister = {
            customer: baseCustomer,
            password: 'test',
            someOtherParameter: 'this should not be passed to login',
            c_test: 'custom parameter'
        }

        await auth.register(inputToRegister)

        // Body should only include credentials. No other parameters
        expect(registerCustomerSpy).toHaveBeenCalledWith(
            expect.objectContaining({body: {customer: baseCustomer, password: 'test'}})
        )

        // We don't need to verify the first and third parameters as they correspond to the SLAS client and mandatory parameters
        // The second argument is credentials
        // We want to see that only the custom parameters were included in the fourth argument and not any other parameters
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            {body: {c_test: 'custom parameter'}}
        )
    })

    test.each([
        // When user has not selected DNT pref
        [true, undefined, {dnt: true}],
        [false, undefined, {dnt: false}],
        [undefined, undefined, {dnt: false}],
        // When user has selected DNT, the dw_dnt cookie sets dnt
        [true, '0', {dnt: false}],
        [false, '1', {dnt: true}],
        [false, '0', {dnt: false}]
    ])(
        'dnt flag is set correctly for defaultDnt=`%p`, dw_dnt=`%i`, expected=`%s`',
        async (defaultDnt, dw_dnt, expected) => {
            const auth = new Auth({...config, defaultDnt})
            if (dw_dnt) {
                // @ts-expect-error private method
                auth.set('dw_dnt', dw_dnt)
            }
            await auth.loginGuestUser()
            expect(helpers.loginGuestUser).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining(expected)
            )
            const expectedDnt = 'dnt' in expected ? expected.dnt : false
            const dntPref = auth.getDnt({
                includeDefaults: true
            })
            expect(dntPref).toBe(expectedDnt)
        }
    )

    test.each([
        // auth config | expected return value
        [undefined, DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL, true],
        [undefined, DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL, false],
        [0, DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL, false],
        [-1, DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL, false],
        [
            DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL + 1,
            DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL,
            false
        ],
        [900, 900, false]
    ])(
        'refreshTokenRegisteredCookieTTL is set correctly for refreshTokenRegisteredCookieTTLValue=`%p`, expected=`%s`',
        async (refreshTokenRegisteredCookieTTL, expected, hasNoResponseValue) => {
            // Mock the loginRegisteredUserB2C helper to return a token response
            TOKEN_RESPONSE.refresh_token_expires_in = hasNoResponseValue
                ? undefined
                : DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL
            ;(helpers.loginRegisteredUserB2C as jest.Mock).mockResolvedValueOnce(TOKEN_RESPONSE)

            const auth = new Auth({...config, refreshTokenRegisteredCookieTTL})
            // Call the public method because the getter for refresh_token_expires_in is private
            await auth.loginRegisteredUserB2C({username: 'test', password: 'test'})
            expect(Number(auth.get('refresh_token_expires_in'))).toBe(expected)
        }
    )

    test.each([
        // auth config | expected return value
        [undefined, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, true],
        [undefined, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, false],
        [0, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, false],
        [-1, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, false],
        [DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL + 1, DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL, false],
        [900, 900, false]
    ])(
        'refreshTokenGuestCookieTTL is set correctly for refreshTokenGuestCookieTTLValue=`%p`, expected=`%s`',
        async (refreshTokenGuestCookieTTL, expected, hasNoResponseValue) => {
            // Mock the loginRegisteredUserB2C helper to return a token response
            TOKEN_RESPONSE.refresh_token_expires_in = hasNoResponseValue
                ? undefined
                : DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
            ;(helpers.loginGuestUser as jest.Mock).mockResolvedValueOnce(TOKEN_RESPONSE)

            const auth = new Auth({...config, refreshTokenGuestCookieTTL})
            // Call the public method because the getter for refresh_token_expires_in is private
            await auth.loginGuestUser()
            expect(Number(auth.get('refresh_token_expires_in'))).toBe(expected)
        }
    )

    test('loginGuestUser with slas private', async () => {
        const auth = new Auth(configSLASPrivate)
        await auth.loginGuestUser()
        expect(helpers.loginGuestUserPrivate).toHaveBeenCalled()
        const funcArg = (helpers.loginGuestUserPrivate as jest.Mock).mock.calls[0][2]
        expect(funcArg).toMatchObject({clientSecret: SLAS_SECRET_PLACEHOLDER})
    })

    test('loginGuestUser throws error when API has error', async () => {
        // Force the mock to throw just for this test
        const loginGuestUserSpy = jest.spyOn(helpers, 'loginGuestUser')
        loginGuestUserSpy.mockRejectedValueOnce(new Error('test'))

        const auth = new Auth(config)
        await expect(auth.loginGuestUser()).rejects.toThrow()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })

    test('loginRegisteredUserB2C', async () => {
        const auth = new Auth(config)
        await auth.loginRegisteredUserB2C({username: 'test', password: 'test'})
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalled()
        const functionArg = (helpers.loginRegisteredUserB2C as jest.Mock).mock.calls[0][1]
        expect(functionArg).toMatchObject({username: 'test', password: 'test'})
    })

    test('loginRegisteredUserB2C with slas private', async () => {
        const auth = new Auth(configSLASPrivate)
        await auth.loginRegisteredUserB2C({
            username: 'test',
            password: 'test'
        })
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalled()
        const functionArg = (helpers.loginRegisteredUserB2C as jest.Mock).mock.calls[0][1]
        expect(functionArg).toMatchObject({
            username: 'test',
            password: 'test',
            clientSecret: SLAS_SECRET_PLACEHOLDER
        })
    })

    test('loginRegisteredUserB2C can pass along custom parameters', async () => {
        const options = {
            body: {c_test: 'custom parameter'}
        }
        const credentials = {
            username: 'test',
            password: 'test'
        }
        const auth = new Auth(config)
        await auth.loginRegisteredUserB2C({...credentials, options})
        // We don't need to verify the first and third parameters as they correspond to the SLAS client and mandatory parameters
        // The second argument is credentials, including the client secret
        // The fourth argument is custom parameters
        // We only want to see that the custom parameters were included in the fourth argument
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining(credentials),
            expect.anything(),
            options
        )
    })

    test('loginIDPUser calls isomorphic loginIDPUser', async () => {
        const auth = new Auth(config)
        await auth.loginIDPUser({redirectURI: 'redirectURI', code: 'test'})
        expect(helpers.loginIDPUser).toHaveBeenCalled()
        const functionArg = (helpers.loginIDPUser as jest.Mock).mock.calls[0][2]
        expect(functionArg).toMatchObject({redirectURI: 'redirectURI', code: 'test'})
    })

    test('loginIDPUser adds clientSecret to parameters when using private client', async () => {
        const auth = new Auth(configSLASPrivate)
        await auth.loginIDPUser({redirectURI: 'test', code: 'test'})
        expect(helpers.loginIDPUser).toHaveBeenCalled()
        const functionArg = (helpers.loginIDPUser as jest.Mock).mock.calls[0][1]
        expect(functionArg).toMatchObject({
            clientSecret: SLAS_SECRET_PLACEHOLDER
        })
    })

    test('authorizeIDP calls isomorphic authorizeIDP', async () => {
        const auth = new Auth(config)
        await auth.authorizeIDP({
            redirectURI: 'redirectURI',
            hint: 'test',
            c_customParam: 'customParam'
        })
        expect(helpers.authorizeIDP).toHaveBeenCalled()
        const functionArg = (helpers.authorizeIDP as jest.Mock).mock.calls[0][1]
        expect(functionArg).toMatchObject({
            redirectURI: 'redirectURI',
            hint: 'test',
            c_customParam: 'customParam'
        })
    })

    test('authorizeIDP adds clientSecret to parameters when using private client', async () => {
        const auth = new Auth(configSLASPrivate)
        await auth.authorizeIDP({redirectURI: 'test', hint: 'test'})
        expect(helpers.authorizeIDP).toHaveBeenCalled()
        const privateClient = (helpers.authorizeIDP as jest.Mock).mock.calls[0][2]
        expect(privateClient).toBe(true)
    })

    test('authorizePasswordless calls isomorphic authorizePasswordless', async () => {
        const auth = new Auth(config)
        await auth.authorizePasswordless({
            callbackURI: 'callbackURI',
            userid: 'userid',
            mode: 'callback'
        })
        expect(helpers.authorizePasswordless).toHaveBeenCalled()
        const functionArg = (helpers.authorizePasswordless as jest.Mock).mock.calls[0][2]
        expect(functionArg).toMatchObject({
            callbackURI: 'callbackURI',
            userid: 'userid',
            mode: 'callback'
        })
    })

    test('authorizePasswordless sets mode to sms as configured', async () => {
        const auth = new Auth(configPasswordlessSms)
        await auth.authorizePasswordless({userid: 'userid', mode: 'sms'})
        expect(helpers.authorizePasswordless).toHaveBeenCalled()
        const functionArg = (helpers.authorizePasswordless as jest.Mock).mock.calls[0][2]
        expect(functionArg).toMatchObject({userid: 'userid', mode: 'sms'})
    })

    test('getPasswordLessAccessToken calls isomorphic getPasswordLessAccessToken', async () => {
        const auth = new Auth(config)
        await auth.getPasswordLessAccessToken({pwdlessLoginToken: '12345678'})
        expect(helpers.getPasswordLessAccessToken).toHaveBeenCalled()
        const functionArg = (helpers.getPasswordLessAccessToken as jest.Mock).mock.calls[0][2]
        expect(functionArg).toMatchObject({pwdlessLoginToken: '12345678'})
    })

    test('logout as registered user calls isomorphic logout', async () => {
        const auth = new Auth(config)

        // @ts-expect-error private method
        // simulate logging in as login function is mocked
        auth.set('customer_type', 'registered')

        await auth.logout()
        expect(helpers.logout).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })
    test('logout as guest user does not call isomorphic logout', async () => {
        const auth = new Auth(config)
        await auth.logout()
        expect(helpers.logout).not.toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalled()
    })
    test('updateCustomerPassword calls registered login', async () => {
        jest.spyOn(ShopperCustomers.prototype, 'updateCustomerPassword').mockImplementation()
        const auth = new Auth(config)
        await auth.updateCustomerPassword({
            customer: baseCustomer,
            password: 'test123',
            currentPassword: 'test12',
            shouldReloginCurrentSession: true
        })
        expect(helpers.loginRegisteredUserB2C).toHaveBeenCalled()
    })
    test('PWA private client mode takes priority', async () => {
        const auth = new Auth({...configSLASPrivate, clientSecret: 'someSecret'})
        await auth.loginGuestUser()
        expect(helpers.loginGuestUserPrivate).toHaveBeenCalled()
        const funcArg = (helpers.loginGuestUserPrivate as jest.Mock).mock.calls[0][2]
        expect(funcArg).toMatchObject({clientSecret: SLAS_SECRET_PLACEHOLDER})
    })
    test('Can set a client secret', async () => {
        const auth = new Auth({...config, clientSecret: 'someSecret'})
        await auth.loginGuestUser()
        expect(helpers.loginGuestUserPrivate).toHaveBeenCalled()
        const funcArg = (helpers.loginGuestUserPrivate as jest.Mock).mock.calls[0][2]
        expect(funcArg).toMatchObject({clientSecret: 'someSecret'})
    })
    test('running on the server uses a shared context memory store', () => {
        const refreshTokenGuest = 'guest'

        // Mock running on the server so shared context storage is used.
        // @ts-expect-error read-only property
        utils.onClient = () => false

        // Create a new auth instance and set its guest token.
        const authA = new Auth({...config, siteId: 'siteA'})
        // @ts-expect-error private method
        authA.set('refresh_token_guest', refreshTokenGuest)
        // @ts-expect-error private property
        expect([...authA.stores['memory'].map.keys()]).toEqual([`cc-nx-g_siteA`])

        // Create a second auth instance and ensure that its memory store has previous
        // guest tokens set from the first store (this emulates a second lambda request.)
        const authB = new Auth({...config, siteId: 'siteB'})
        // @ts-expect-error private method
        authB.set('refresh_token_guest', refreshTokenGuest)

        // @ts-expect-error private property
        expect([...authB.stores['memory'].map.keys()]).toEqual([`cc-nx-g_siteA`, `cc-nx-g_siteB`])

        // Set mock value back to expected.
        // @ts-expect-error read-only property
        utils.onClient = () => true
    })

    test.each([
        // When user has not selected DNT pref
        [true, '1'],
        [false, '0'],
        [null, '0']
    ])('setDNT(true) results dw_dnt=1', async (newDntPref, expectedDwDnt) => {
        const auth = new Auth({...config, siteId: 'siteA'})
        await auth.setDnt(newDntPref)
        expect(auth.get('dw_dnt')).toBe(expectedDwDnt)
    })

    test('setDNT(null) results in defaultDnt if defaultDnt is defined', async () => {
        const auth = new Auth({...config, siteId: 'siteA', defaultDnt: true})
        await auth.setDnt(null)
        expect(auth.get('dw_dnt')).toBe('1')
    })

    test('setDNT(true) sets cookie with an expiration time', async () => {
        const setDntSpiedOn = jest.spyOn(Auth.prototype as any, 'set')
        const auth = new Auth({...config, siteId: 'siteA'})
        await auth.setDnt(true)
        expect(setDntSpiedOn).toHaveBeenLastCalledWith(
            'dw_dnt',
            '1',
            expect.objectContaining({expires: expect.any(Number)})
        )
    })

    test('setDNT(false) sets cookie with an expiration time', async () => {
        const setDntSpiedOn = jest.spyOn(Auth.prototype as any, 'set')
        const auth = new Auth({...config, siteId: 'siteA'})
        await auth.setDnt(false)
        expect(setDntSpiedOn).toHaveBeenLastCalledWith(
            'dw_dnt',
            '0',
            expect.objectContaining({expires: expect.any(Number)})
        )
    })

    test('setDNT(null) sets cookie WITHOUT an expiration time', async () => {
        const setDntSpiedOn = jest.spyOn(Auth.prototype as any, 'set')
        const auth = new Auth({...config, siteId: 'siteA'})
        await auth.setDnt(null)
        await waitFor(() => {
            expect(setDntSpiedOn).not.toHaveBeenCalledWith(
                'dw_dnt',
                '1',
                expect.objectContaining({expires: expect.any(Number)})
            )
        })
    })

    test('getDnt() returns undefined if token and cookie value is conflicting', async () => {
        const getSpiedOn = jest.spyOn(Auth.prototype as any, 'get')
        const parseSlasJWTSpiedOn = jest.spyOn(Auth.prototype as any, 'parseSlasJWT')
        parseSlasJWTSpiedOn.mockReturnValue({
            dnt: '1'
        })
        getSpiedOn.mockReturnValue('0')

        const auth = new Auth({...config, siteId: 'siteA'})
        auth.getDnt()
        await waitFor(() => {
            expect(auth.getDnt()).toBeUndefined()
        })
        getSpiedOn.mockRestore()
        parseSlasJWTSpiedOn.mockRestore()
    })

    test('token call clears SFRA auth token cookie and sets all token from the response', async () => {
        const getDntSpy = jest.spyOn(Auth.prototype, 'getDnt')
        getDntSpy.mockImplementation((options?: {includeDefaults: boolean}) => {
            if (options?.includeDefaults) {
                return false
            }
            return undefined
        })
        const auth = new Auth(config)

        // Set up initial SFRA auth token
        // @ts-expect-error private method
        auth.set('access_token_sfra', 'sfra_token')

        // Verify the token was set correctly
        expect(auth.get('access_token_sfra')).toBe('sfra_token')

        // Mock the token response that loginGuestUser will return
        const tokenResponse: ShopperLoginTypes.TokenResponse = {
            access_token:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYy1zbGFzOjp6enJmXzAwMTo6c2NpZDpjOWM0NWJmZC0wZWQzLTRhYTIteHh4eC00MGY4ODk2MmI4MzY6OnVzaWQ6YjQ4NjUyMzMtZGU5Mi00MDM5LXh4eHgtYWEyZGZjOGMxZWE1IiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJpc2IiOiJ1aWRvOmVjb206OnVwbjpHdWVzdHx8am9obi5kb2VAZXhhbXBsZS5jb206OnVpZG46Sm9obiBEb2U6OmdjaWQ6Z3Vlc3QtMTIzNDU6OnJjaWQ6cmVnaXN0ZXJlZC02Nzg5MCIsImRudCI6InRlc3QifQ.9yKtUb22ExO-Q4VNQRAyIgTm63l3x5z45Uu1FIQa5dQ',
            customer_id: 'customer_id_xyz',
            enc_user_id: 'enc_user_id_xyz',
            expires_in: 1800,
            id_token: 'id_token_xyz',
            refresh_token: 'refresh_token_xyz',
            token_type: 'token_type_abc',
            usid: 'usid_xyz',
            idp_access_token: 'idp_access_token_xyz',
            refresh_token_expires_in: DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
        }

        // Mock the helper to return token response
        const loginGuestUserSpy = jest.spyOn(helpers, 'loginGuestUser')
        loginGuestUserSpy.mockResolvedValueOnce(tokenResponse)

        // Make the token call
        await auth.loginGuestUser()

        // Verify SFRA auth token is cleared
        expect(auth.get('access_token_sfra')).toBeFalsy()

        // Verify all token data is set correctly
        expect(auth.get('access_token')).toBe(tokenResponse.access_token)

        // Clean up the spy
        getDntSpy.mockRestore()
    })
})

describe('Auth service sends credentials fetch option to the ShopperLogin API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Adds fetch options with credentials when not defined in config', async () => {
        const auth = new Auth(config)
        await auth.loginGuestUser()

        // Ensure the helper method was called
        expect(helpers.loginGuestUser).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)

        // Check that the correct parameters were passed to the helper
        const callArguments = (helpers.loginGuestUser as jest.Mock).mock.calls[0]
        expect(callArguments).toBeDefined()
        expect(callArguments.length).toBeGreaterThan(0)

        const shopperLogin: ShopperLogin<ApiClientConfigParams> = callArguments[0]
        expect(shopperLogin).toBeDefined()
        expect(shopperLogin.clientConfig).toBeDefined()
        expect(shopperLogin.clientConfig.fetchOptions).toBeDefined()

        // Ensure fetch options include the expected credentials
        expect(shopperLogin.clientConfig.fetchOptions.credentials).toBe('same-origin')
    })

    test('Does not override the credentials in fetch options if already exists', async () => {
        const configWithFetchOptions = {
            ...config,
            fetchOptions: {
                credentials: 'include'
            }
        }
        const auth = new Auth(configWithFetchOptions)
        await auth.loginGuestUser()

        // Ensure the helper method was called
        expect(helpers.loginGuestUser).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)

        // Check that the correct parameters were passed to the helper
        const callArguments = (helpers.loginGuestUser as jest.Mock).mock.calls[0]
        expect(callArguments).toBeDefined()
        expect(callArguments.length).toBeGreaterThan(0)

        const shopperLogin: ShopperLogin<ApiClientConfigParams> = callArguments[0]
        expect(shopperLogin).toBeDefined()
        expect(shopperLogin.clientConfig).toBeDefined()
        expect(shopperLogin.clientConfig.fetchOptions).toBeDefined()

        // Ensure fetch options include the expected credentials
        expect(shopperLogin.clientConfig.fetchOptions.credentials).toBe('include')
    })

    test('Adds credentials to the fetch options if it is missing', async () => {
        const configWithFetchOptions = {
            ...config,
            fetchOptions: {
                cache: 'no-cache'
            }
        }
        const auth = new Auth(configWithFetchOptions)
        await auth.loginGuestUser()

        // Ensure the helper method was called
        expect(helpers.loginGuestUser).toHaveBeenCalled()
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)

        // Check that the correct parameters were passed to the helper
        const callArguments = (helpers.loginGuestUser as jest.Mock).mock.calls[0]
        expect(callArguments).toBeDefined()
        expect(callArguments.length).toBeGreaterThan(0)

        const shopperLogin: ShopperLogin<ApiClientConfigParams> = callArguments[0]
        expect(shopperLogin).toBeDefined()
        expect(shopperLogin.clientConfig).toBeDefined()
        expect(shopperLogin.clientConfig.fetchOptions).toBeDefined()

        // Ensure fetch options include the expected credentials
        expect(shopperLogin.clientConfig.fetchOptions.credentials).toBe('same-origin')
    })
})
