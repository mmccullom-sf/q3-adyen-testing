/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, CacheUpdateMatrix} from '../types'
import {CLIENT_KEYS} from '../../constant'

const noop = () => ({})

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_LOGIN
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    authorizePasswordlessCustomer: noop,
    logoutCustomer: () => {
        return {
            remove: [{queryKey: ['/commerce-sdk-react']}]
        }
    },
    authorizeCustomer: noop,
    getAccessToken: noop,
    getSessionBridgeAccessToken: noop,
    getTrustedSystemAccessToken: noop,
    getTrustedAgentAccessToken: noop,
    getPasswordResetToken: noop,
    resetPassword: noop,
    getPasswordLessAccessToken: noop,
    revokeToken: noop,
    introspectToken: noop
}
