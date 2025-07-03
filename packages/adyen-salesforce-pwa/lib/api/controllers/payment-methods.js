import {getCurrencyValueForApi} from '../../utils/parsers.mjs'
import {BLOCKED_PAYMENT_METHODS} from '../../utils/constants.mjs'
import {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import AdyenCheckoutConfig from './checkout-config'
import Logger from './logger'
import {v4 as uuidv4} from 'uuid'
import {getAdyenConfigForCurrentSite} from '../../utils/getAdyenConfigForCurrentSite.mjs'
import {AdyenError} from '../models/AdyenError'
import {getApplicationInfo} from '../../utils/getApplicationInfo.mjs'

const errorMessages = {
    UNAUTHORIZED: 'unauthorized',
    INVALID_BASKET: 'invalid basket',
    NO_PAYMENT_METHODS: 'no payment methods'
}

async function getPaymentMethods(req, res, next) {
    Logger.info('getPaymentMethods', 'start')

    try {
        console.log("=== Starting getPaymentMethods ===");
        console.log("Request query:", req.query);
        console.log("Request headers:", {
            authorization: req.headers.authorization ? 'Present' : 'Missing',
            customerid: req.headers.customerid || 'Missing'
        });

        const {siteId} = req.query
        console.log("siteId:", siteId);
        
        if (!siteId) {
            throw new AdyenError('Missing siteId parameter', 400)
        }

        console.log("=== Step 1: Getting checkout instance ===");
        const checkout = AdyenCheckoutConfig.getInstance(siteId)
        console.log("checkout instance created:", !!checkout);

        console.log("=== Step 2: Getting Adyen config ===");
        const adyenConfig = getAdyenConfigForCurrentSite(siteId)
        console.log("adyenConfig:", {
            merchantAccount: adyenConfig?.merchantAccount || 'Missing',
            environment: adyenConfig?.environment || 'Missing',
            hasApiKey: !!adyenConfig?.apiKey
        });

        console.log("=== Step 3: Getting app config ===");
        const {app: appConfig} = getConfig()
        console.log("appConfig.commerceAPI:", {
            present: !!appConfig?.commerceAPI,
            parameters: appConfig?.commerceAPI?.parameters || 'Missing'
        });

        console.log("=== Step 4: Creating ShopperCustomers instance ===");
        const shopperCustomers = new ShopperCustomers({
            ...appConfig.commerceAPI,
            headers: {authorization: req.headers.authorization}
        })
        console.log("shopperCustomers created");

        console.log("=== Step 5: Getting customer ===");
        const customer = await shopperCustomers.getCustomer({
            parameters: {
                customerId: req.headers.customerid
            }
        })
        console.log("customer response:", {
            customerId: customer?.customerId || 'Missing',
            authType: customer?.authType || 'Missing'
        });

        if (!customer?.customerId) {
            throw new AdyenError(errorMessages.UNAUTHORIZED, 401)
        }

        console.log("=== Step 6: Getting customer baskets ===");
        const {baskets} = await shopperCustomers.getCustomerBaskets({
            parameters: {
                customerId: customer?.customerId
            }
        })
        console.log("baskets response:", {
            count: baskets?.length || 0,
            firstBasket: baskets?.[0] ? {
                basketId: baskets[0].basketId,
                orderTotal: baskets[0].orderTotal,
                productTotal: baskets[0].productTotal,
                currency: baskets[0].currency
            } : 'No basket'
        });

        if (!baskets?.length) {
            throw new AdyenError(errorMessages.INVALID_BASKET, 404)
        }

        console.log("=== Step 7: Preparing payment request ===");
        const [{orderTotal, productTotal, currency}] = baskets
        const {locale: shopperLocale} = req.query
        const countryCode = shopperLocale?.slice(-2)

        const paymentMethodsRequest = {
            blockedPaymentMethods: BLOCKED_PAYMENT_METHODS,
            shopperLocale,
            countryCode,
            merchantAccount: adyenConfig.merchantAccount,
            amount: {
                value: getCurrencyValueForApi(orderTotal || productTotal, currency),
                currency: currency
            }
        }
        console.log("paymentMethodsRequest:", paymentMethodsRequest);

        if (customer?.authType === 'registered') {
            paymentMethodsRequest.shopperReference = customer.customerId
        }

        console.log("=== Step 8: Calling Adyen API ===");
        const response = await checkout.paymentMethods(paymentMethodsRequest, {
            idempotencyKey: uuidv4()
        })
        console.log("Adyen API response:", {
            hasPaymentMethods: !!response?.paymentMethods,
            paymentMethodsCount: response?.paymentMethods?.length || 0
        });

        if (!response?.paymentMethods?.length) {
            throw new AdyenError(errorMessages.NO_PAYMENT_METHODS, 400)
        }

        console.log("=== Step 9: Success - preparing response ===");
        Logger.info('getPaymentMethods', 'success')
        res.locals.response = {
            ...response,
            applicationInfo: getApplicationInfo(adyenConfig.systemIntegratorName)
        }
        next()
    } catch (err) {
        console.log("=== ERROR in getPaymentMethods ===");
        console.log("Error type:", err.constructor.name);
        console.log("Error message:", err.message);
        console.log("Error status:", err.statusCode || err.status);
        console.log("Error stack:", err.stack);
        
        if (err.response) {
            console.log("Error response status:", err.response.status);
            console.log("Error response data:", err.response.data);
        }
        
        Logger.error('getPaymentMethods', JSON.stringify({
            message: err.message,
            statusCode: err.statusCode || err.status,
            stack: err.stack
        }))
        next(err)
    }
}

export default getPaymentMethods
