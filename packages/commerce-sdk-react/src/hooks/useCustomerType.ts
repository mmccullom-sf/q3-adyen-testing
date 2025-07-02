/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'
import useLocalStorage from './useLocalStorage'
import useConfig from './useConfig'
import {onClient} from '../utils'

export type CustomerType = null | 'guest' | 'registered'
type useCustomerType = {
    customerType: CustomerType
    isGuest: boolean
    isRegistered: boolean
    isExternal: boolean
}

/**
 * A hook to return customer auth type.
 *
 * Customer type can have 3 values:
 * - null
 * - guest
 * - registered
 *
 * During initialization, type is null. And it is possible that
 * isGuest and isRegistered to both be false.
 *
 * @group Helpers
 * @category Shopper Authentication
 *
 */
const useCustomerType = (): useCustomerType => {
    const config = useConfig()
    const auth = useAuthContext()

    let customerType: string | null = onClient()
        ? // This conditional is a constant value based on the environment, so the same path will
          // always be followed., and the "rule of hooks" is not violated.
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useLocalStorage(`customer_type_${config.siteId}`)
        : auth.get('customer_type')

    const isGuest = customerType === 'guest'
    const isRegistered = customerType === 'registered'

    if (customerType !== null && customerType !== 'guest' && customerType !== 'registered') {
        customerType = null
    }

    // The `uido` is a value within the `isb` claim of the SLAS access token that denotes the IDP origin of the user
    // If `uido` is not equal to `slas` or `ecom`, the user is considered an external user
    const uido: string | null = onClient()
        ? // eslint-disable-next-line react-hooks/rules-of-hooks
          useLocalStorage(`uido_${config.siteId}`)
        : auth.get('uido')

    const isExternal: boolean = customerType === 'registered' && uido !== 'slas' && uido !== 'ecom'

    return {
        customerType,
        isGuest,
        isRegistered,
        isExternal
    }
}

export default useCustomerType
