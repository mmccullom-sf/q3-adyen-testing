/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, within} from '@testing-library/react'
import {rest} from 'msw'
import {
    renderWithProviders,
    createPathWithDefaults,
    guestToken
} from '@salesforce/retail-react-app/app/utils/test-utils'
import {
    mockOrderHistory,
    mockedGuestCustomer,
    mockedRegisteredCustomer,
    mockOrderProducts,
    mockPasswordUpdateFalure
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {useCustomerType} from '@salesforce/commerce-sdk-react'
import Account from '@salesforce/retail-react-app/app/pages/account/index'
import Login from '@salesforce/retail-react-app/app/pages/login'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

jest.setTimeout(60000)
jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useCustomerType: jest.fn()
}))

const MockedComponent = () => {
    return (
        <Switch>
            <Route
                path={createPathWithDefaults('/account')}
                render={(props) => <Account {...props} />}
            />
            <Route
                path={createPathWithDefaults('/login')}
                render={(props) => <Login {...props} />}
            />
        </Switch>
    )
}

// Set up and clean up
beforeEach(() => {
    global.server.use(
        rest.get('*/products', (req, res, ctx) => res(ctx.delay(0), ctx.json(mockOrderProducts))),
        rest.get('*/customers/:customerId/orders', (req, res, ctx) =>
            res(ctx.delay(0), ctx.json(mockOrderHistory))
        ),
        rest.post('*/oauth2/token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'customerid',
                    access_token: guestToken,
                    refresh_token: 'testrefeshtoken',
                    usid: 'testusid',
                    enc_user_id: 'testEncUserId',
                    id_token: 'testIdToken'
                })
            )
        )
    )

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', createPathWithDefaults('/account'))
})
afterEach(() => {
    jest.resetModules()
    jest.restoreAllMocks()
})

const expectedBasePath = '/uk/en-GB'
describe('Test redirects', function () {
    beforeEach(() => {
        global.server.use(
            rest.get('*/customers/:customerId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockedGuestCustomer))
            })
        )
    })
    test('Redirects to login page if the customer is not logged in', async () => {
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app, isGuest: true}
        })
        await waitFor(() => expect(window.location.pathname).toBe(`${expectedBasePath}/login`))
    })
})
describe('Page Navigation', () => {
    test('works for subpages', async () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        global.server.use(
            rest.get('*/products', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderProducts))
            }),
            rest.get('*/customers/:customerId/orders', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderHistory))
            })
        )
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        expect(await screen.findByTestId('account-page')).toBeInTheDocument()

        const nav = within(screen.getByTestId('account-detail-nav'))
        await user.click(nav.getByText('Addresses'))
        await waitFor(() =>
            expect(window.location.pathname).toBe(`${expectedBasePath}/account/addresses`)
        )
        await user.click(nav.getByText('Order History'))
        await waitFor(() =>
            expect(window.location.pathname).toBe(`${expectedBasePath}/account/orders`)
        )
    })
})

describe('Render and logs out', function () {
    test('Renders account detail page by default for logged-in customer, and can log out', async () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})

        const {user} = renderWithProviders(<MockedComponent />)

        // Render user profile page
        await waitFor(() => {
            expect(window.location.pathname).toBe(`${expectedBasePath}/account`)
            expect(screen.getByTestId('account-detail-page')).toBeInTheDocument()
            expect(screen.getByText('Testing Tester')).toBeInTheDocument()
            expect(screen.getByText('customer@test.com')).toBeInTheDocument()
            expect(screen.getByText('(727) 555-1234')).toBeInTheDocument()
            const logOutIcons = screen.getAllByLabelText('signout')
            expect(logOutIcons[0]).toHaveAttribute('aria-hidden', 'true')
            expect(logOutIcons[1]).toHaveAttribute('aria-hidden', 'true')
        })

        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        await user.click(screen.getAllByText(/Log Out/)[0])

        await waitFor(() => {
            expect(window.location.pathname).toBe(`${expectedBasePath}/login`)
            expect(screen.getByTestId('login-page')).toBeInTheDocument()
        })
    })
})

describe('updating profile', function () {
    beforeEach(() => {
        global.server.use(
            rest.patch('*/customers/:customerId', (req, res, ctx) => {
                return res(
                    ctx.json({
                        ...mockedRegisteredCustomer,
                        firstName: 'Geordi',
                        phoneHome: '(567) 123-5585'
                    })
                )
            })
        )
    })
    test('Allows customer to edit profile details', async () => {
        useCustomerType.mockReturnValue({isRegistered: true, isExternal: false})
        const {user} = renderWithProviders(<MockedComponent />)
        expect(await screen.findByTestId('account-page')).toBeInTheDocument()
        expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()
        await waitFor(() => {
            const firstName = screen.getByText(/Testing Tester/i)
            expect(firstName).toBeInTheDocument()
        })
        const el = within(screen.getByTestId('sf-toggle-card-my-profile'))

        await user.click(el.getByText(/edit/i))

        await user.type(el.getByLabelText(/first name/i), 'Geordi')
        await user.type(el.getByLabelText(/Phone Number/i), '5671235585')

        await user.click(el.getByText(/save/i))

        expect(await screen.findByText('Geordi Tester')).toBeInTheDocument()
        expect(await screen.findByText('(567) 123-5585')).toBeInTheDocument()
    })
})

describe('updating password', function () {
    beforeEach(() => {
        useCustomerType.mockReturnValue({isRegistered: true, isExternal: false})
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid',
                        access_token: guestToken,
                        refresh_token: 'testrefeshtoken',
                        usid: 'testusid',
                        enc_user_id: 'testEncUserId',
                        id_token: 'testIdToken'
                    })
                )
            )
        )
    })
    test('Password update form is rendered correctly', async () => {
        const {user} = renderWithProviders(<MockedComponent />)
        expect(await screen.findByTestId('account-page')).toBeInTheDocument()
        expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()

        const el = within(screen.getByTestId('sf-toggle-card-password'))
        await user.click(el.getByText(/edit/i))

        expect(el.getByLabelText(/current password/i)).toBeInTheDocument()
        expect(el.getByLabelText('New Password')).toBeInTheDocument()
        expect(el.getByLabelText('Confirm New Password')).toBeInTheDocument()
        expect(el.getByText(/forgot password/i)).toBeInTheDocument()
    })

    test('Allows customer to update password', async () => {
        global.server.use(
            rest.put('*/password', (req, res, ctx) => res(ctx.status(204), ctx.json()))
        )

        const {user} = renderWithProviders(<MockedComponent />)

        const el = within(screen.getByTestId('sf-toggle-card-password'))
        await user.click(el.getByText(/edit/i))
        await user.type(el.getByLabelText(/current password/i), 'Password!12345')
        await user.type(el.getByLabelText('New Password'), 'Password!98765')
        await user.type(el.getByLabelText('Confirm New Password'), 'Password!98765')
        await user.click(el.getByText(/Forgot password/i))
        await user.click(el.getByText(/save/i))

        // Verify the form is saved and shows success state
        await waitFor(() => {
            expect(el.queryByText(/save/i)).not.toBeInTheDocument()
        })
    })

    test('Warns customer when updating password with invalid current password', async () => {
        global.server.use(
            rest.put('*/password', (req, res, ctx) =>
                res(ctx.status(401), ctx.json(mockPasswordUpdateFalure))
            )
        )

        const {user} = renderWithProviders(<MockedComponent />)

        const el = within(screen.getByTestId('sf-toggle-card-password'))
        await user.click(el.getByText(/edit/i))
        await user.type(el.getByLabelText(/current password/i), 'Password!123456')
        await user.type(el.getByLabelText('New Password'), 'Password!98765')
        await user.type(el.getByLabelText('Confirm New Password'), 'Password!98765')
        await user.click(el.getByText(/save/i))

        expect(await screen.findByTestId('password-update-error')).toBeInTheDocument()
    })
})
