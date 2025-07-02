/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const config = require('../../config')
const {
    registerShopper,
    addProductToCart,
    validateOrderHistory,
    validateWishlist,
    loginShopper,
    navigateToPDPMobile,
    answerConsentTrackingForm
} = require('../../scripts/pageHelpers')
const {generateUserCredentials, getCreditCardExpiry} = require('../../scripts/utils.js')

let registeredUserCredentials = {}

test.beforeAll(async () => {
    // Generate credentials once and use throughout tests to avoid creating a new account
    registeredUserCredentials = generateUserCredentials()
})

/**
 * Test that registered shoppers can add a product to cart and go through the entire checkout process,
 * validating that shopper is able to get to the order summary section,
 * and that order shows up in order history
 */
test('Registered shopper can checkout items', async ({page}) => {
    // Since we're re-using the same account, we need to check if the user is already registered.
    // This ensures the tests are independent and not dependent on the order they are run in.
    const isLoggedIn = await loginShopper({
        page,
        userCredentials: registeredUserCredentials
    })

    if (!isLoggedIn) {
        await registerShopper({
            page,
            userCredentials: registeredUserCredentials,
            isMobile: true
        })
    }

    await answerConsentTrackingForm(page)
    await page.waitForLoadState()
    
    // Verify user is logged in using URL and email verification
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/account/)
    await expect(page.getByText(registeredUserCredentials.email)).toBeVisible()

    // Shop for items as registered user
    await addProductToCart({page, isMobile: true})

    // cart
    await page.getByLabel(/My cart/i).click()

    await expect(page.getByRole('link', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()

    await page.getByRole('link', {name: 'Proceed to Checkout'}).click()

    // Confirm the email input toggles to show sign out button on clicking "Checkout as guest"
    const step0Card = page.locator("div[data-testid='sf-toggle-card-step-0']")

    await expect(step0Card.getByRole('button', {name: /Sign Out/i})).toBeVisible()

    await expect(page.getByRole('heading', {name: /Shipping Address/i})).toBeVisible()

    await page.locator('input#firstName').fill(registeredUserCredentials.firstName)
    await page.locator('input#lastName').fill(registeredUserCredentials.lastName)
    await page.locator('input#phone').fill(registeredUserCredentials.phone)
    await page.locator('input#address1').fill(registeredUserCredentials.address.street)
    await page.locator('input#city').fill(registeredUserCredentials.address.city)
    await page.locator('select#stateCode').selectOption(registeredUserCredentials.address.state)
    await page.locator('input#postalCode').fill(registeredUserCredentials.address.zipcode)

    await page.getByRole('button', {name: /Continue to Shipping Method/i}).click()

    // Confirm the shipping details form toggles to show edit button on clicking "Checkout as guest"
    const step1Card = page.locator("div[data-testid='sf-toggle-card-step-1']")

    await expect(step1Card.getByRole('button', {name: /Edit/i})).toBeVisible()

    await expect(page.getByRole('heading', {name: /Shipping & Gift Options/i})).toBeVisible()

    await page.waitForLoadState()
    
    // Handle optional shipping step - some checkout flows skip this step
    const continueToPayment = page.getByRole('button', {
        name: /Continue to Payment/i
    })

    let hasShippingStep = false
    try {
        await expect(continueToPayment).toBeVisible({timeout: 2000})
        await continueToPayment.click()
        hasShippingStep = true
    } catch {
        // Shipping step was skipped, proceed directly to payment
    }

    // Verify step-2 edit button only if shipping step was present
    if (hasShippingStep) {
        const step2Card = page.locator("div[data-testid='sf-toggle-card-step-2']")
        await expect(step2Card.getByRole('button', {name: /Edit/i})).toBeVisible()
    }

    await expect(page.getByRole('heading', {name: /Payment/i})).toBeVisible()

    const creditCardExpiry = getCreditCardExpiry()

    await page.locator('input#number').fill('4111111111111111')
    await page.locator('input#holder').fill('John Doe')
    await page.locator('input#expiry').fill(creditCardExpiry)
    await page.locator('input#securityCode').fill('213')

    await page.getByRole('button', {name: /Review Order/i}).click()

    // Confirm the shipping options form toggles to show edit button on clicking "Checkout as guest"
    const step3Card = page.locator("div[data-testid='sf-toggle-card-step-3']")

    await expect(step3Card.getByRole('button', {name: /Edit/i})).toBeVisible()
    page.getByRole('button', {name: /Place Order/i})
        .first()
        .click()

    const orderConfirmationHeading = page.getByRole('heading', {
        name: /Thank you for your order!/i
    })
    await orderConfirmationHeading.waitFor()

    await expect(page.getByRole('heading', {name: /Order Summary/i})).toBeVisible()
    await expect(page.getByText(/2 Items/i)).toBeVisible()
    await expect(page.getByRole('link', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()

    // order history
    await validateOrderHistory({page})
})

/**
 * Test that registered shoppers can navigate to PDP and add a product to wishlist
 */
test('Registered shopper can add item to wishlist', async ({page}) => {
    const isLoggedIn = await loginShopper({
        page,
        userCredentials: registeredUserCredentials
    })

    if (!isLoggedIn) {
        await registerShopper({
            page,
            userCredentials: registeredUserCredentials,
            isMobile: true
        })
    }
    await answerConsentTrackingForm(page)
    await page.waitForLoadState()
    
    // Verify user is logged in using URL and email verification
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/account/)
    await expect(page.getByText(registeredUserCredentials.email)).toBeVisible()

    // PDP
    await navigateToPDPMobile({page})

    // add product to wishlist
    await expect(page.getByRole('heading', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()
    await page.getByRole('radio', {name: 'L', exact: true}).click()
    await page.getByRole('button', {name: /Add to Wishlist/i}).click()

    // wishlist
    await validateWishlist({page})
})
