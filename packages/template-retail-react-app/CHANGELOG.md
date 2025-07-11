## v7.0.0-dev.0 (May 20, 2025)

- Improved the layout of product tiles in product scroll and product list [#2446](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2446)
- [a11y] Ensure voiceover announces contents of the email confirmation modal [#2540](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2540)
- Updated 6 new languages [#2495](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2495)
- Fix Einstein event tracking for `addToCart` event [#2558](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2558)
- Update latest translations for all languages [#2616](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2616)
- Load active data scripts on demand only [#2623](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2623)

## v6.1.0 (May 22, 2025)

- Fix hreflang alternate links [#2269](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2269)
- PDP / PLP: Add page meta data tags that have been defined in BM [#2232](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2232)
- Send PWA Kit events to Data Cloud [#2318](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2318)
- Fix dependencies vulnerabilities [#2338](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2338)
- Fix accessibility issues [#2375](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2375)
- Update cc-datacloud-typescript package to use a fixed lock version [#2392](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2392)
- Add Confirm New Password input field to Reset & Change Password flows [#2395](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2395)
- Update the configuration of datacloud [#2467](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2467)
- Integrate Service Cloud's Messaging In App and Web (MIAW) chat service with commerce AI shopping agent [#2416](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2416)

## v6.0.1 (Mar 05, 2025)
- Update PWA-Kit SDKs to v3.9.1 [#2301](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2301)

## v6.0.0 (Feb 18, 2025)

- DNT Consent Banner: [#2203](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2203)
- Support Node 22 [#2218](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2218)
- Implemented opt-in Social & Passwordless Login features and fixed the Reset Password flow which now leverages SLAS APIs [#2079] (https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2079)
- Allow store to be selectable in StoreLocator [#2187](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2187)
- Replace transfer basket call with merge basket on checkout [#2138](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2138)

### Bug Fixes
- [BUG] Fixed GET /shopper-context API calls being made without the usid [#2206](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2206)
- Update test data references to 2024, and unify to 01/2040 [#2196](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2197)
- Fixed failing checkout tests [#2195](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2195)
- [BUG] Fixed "getCheckboxProps is not a function" when rendering checkout page in generated app.[#2140](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2140)
- [BUG] Fix images being fetced multiple times on Safari [#2223](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2223)

### Accessibility Improvements
- [a11y] Fix LinkList component to follow a11y practise [#2098])(https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2098)


## v5.0.0 (Oct 28, 2024)

### New Features
- Implement ability to set Shopper Context via search parameters in the Retail React App [#1986](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1986)
- Display a promo banner from Page Designer in the PLP page of the Retail React App [#2016](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2016)
- Clear auth state if session has been invalidated by a password change [#2092](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2092)

### Performance Improvements

- PLP: When products are being refetched, only the pricing and promotions sections will display a skeleton in the ProductTile [#2064](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2064)
- Remove ocapi session-bridging on phased launches [#2011](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2011)

### Other Changes

- [Server Affinity] - Attach dwsid to SCAPI request headers & remove OCAPI proxy [#2090](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2090)
- Announce wishlist change in total for screen readers (a11y) [#2033](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2033)
- Fixed a bug that incorrectly imports uninstalled package `@chakra-ui/layout` [#2047](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2047)
- Replace getAppOrigin with useOrigin to have a better support for an app origin building. [#2050](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2050)
- PWA Kit projects have Active Data tracking set to "true" by default [#1983](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1983).

### Bug Fixes
- The unused `njwt` npm package had a security vulnerability, since it was unused, the package has been dropped
- Remove save/edit billing action in checkout page for the registered user [#1976](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1976)
- Product scroller: don't skip tiles if window is too large [#2003](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2003)
- PDP / PLP: Render non HTTP 404 erros [#2003](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2003)
- Error page: Render home page when clicking nav icon [#2003](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2003)
- Encode non ASCII HTTP headers when `encodeNonAsciiHttpHeaders` flag is set to true in `ssr.js` [#2009](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2009)
- Updated @salesforce/commerce-sdk-react to 3.0.1 to fix an issue with the expires attribute of cookies, ensuring it uses seconds instead of days [#1994](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1994)


### Accessibility Improvements
- [a11y] Hide svg from screenreader as they are decorative on homepage [#1980](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1980)
- [a11y] Hide log out svg from screenreader as they are decorative [#2000](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2000)
- [a11y] Ensure heading level matches the heading's visual importance/level [#2000](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2000)
- [a11y] Provide a descriptive dialog title for Mobile Navigation Header [#2000](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2000)
- Hide breadcrumb chevrons from screen readers [#1965](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1965)
- Add descriptive text for screen readers on product edit modal in cart page [#1965](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1965)
- A11y: Fix search bar header element focus order [#1969](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1969)
- A11y: Order Details - hide decorative image and convert some p tags as proper headings [#2026](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2026)
- Add aria-labels for buttons in product item wishlist component to ensure they are unique and descriptive. [#2023](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2023)
- Focus onto the `ToggleCard` title whenever the component is opened to be editted [#2029](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2029)
- Add descriptive acccessibility label for edit/remove buttons on account addresses and checkout pages [#2037](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2037)
- [a11y] Mobile view account menu a11y adjustments [#2059](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2059)
- [a11y] PLP - Use header tags for filter options [#2065](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2065)


## v4.0.0 (Aug 7, 2024)

### New Features

- Support product bundles [#1916](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1916/)
- Add Store Locator [#1922](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1922)

### Bug Fixes

- Update serialized query data via `beforeHydrate` to prevent data re-fetching on load [#1912](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1912)
- Out of stock and low stock items are removed from cart and checkout as unavailable products [#1881](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1881)
- Fix infinity sign price on product tile [#1903](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1903)
- Remove unecessary params from product search [#1873](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1873)

### Accessibility Improvements

- Improve accessibility readout for strikethrough price on shipping options in checkout page [#1892](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1892)
- Ensure credit card informational tooltip on checkout page persists after the user is no longer hovering over it [#1890](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1890)
- A11y: Add aria-label to the address form based on the address type [#1904](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1904)
- A11y: Account Nav fixes [#1884](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1884)
- A11y: Replace `<p>` tags with header tag in home page Features section [#1902](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1902)
- Add aria-label for Checkout's action buttons [#1906](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1906)
- Avoid forced focus changes that are not user-initiated [#1940](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1940)


## v3.0.2 (Jul 11, 2024)

### Bug Fixes

- Fix StorefrontPreview component add siteId query parameter to shopper context calls [#1891](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1891)

### Accessibility improvements

- Ensure that the email field on the checkout page receives focus after content updates [#1894](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1894)

## v3.0.1 (Jul 9, 2024)

### Bug Fixes

- Fix basket transfer during checkout login [#1887](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1887)

## v3.0.0 (Jun 25, 2024)

### Improvements

- Product Tile Revamp
  - Display different pricing for various products on Product tiles and PDP [#1760](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1760)
  - Display pricing for cart, checkout and wishlist page [#1796](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1796)
  - Shows promotional callout message on Product List and Product Detail pages [#1786](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1786) [#1804](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1804)
  - Display selectable swatch groups for attributes like color [#1773](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1773)
  - Show badges [#1791](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1791)

- Lazy basket creation [#1677](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1677)
- Use `stale-while-revalidate` cache control directive [#1744](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1744)

### Accessibility Improvements

- Added live region support to components [#1825](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1825)
- Replace p tag with heading tags in cart page [#1818](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1818)
- Fix product tile img alt text [#1769](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1769)
- Add aria-hidden to search icon [#1809](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1809)
- Add explicit headers to cart modal [#1811](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1811)
- Add autocomplete to text input fields [#1840](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1840)
- Add error icon to error messages [#1839](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1839)

### Performance Improvements

- Make navigation components lazy load their categories [#1656](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1656) [#1673](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1673)

### Bug Fixes

- Fix seo component not settings keywords meta tag [#1762](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1762)
- Fix RecommendedProducts' toggling of the favourite icon [#1861](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1861)


## v2.4.1 (Apr 17, 2024)
- Update dependency commerce-sdk-react to 1.4.1 to have access to all params keys for Shopper Search [#1750](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1750)

## v2.4.0 (Apr 15, 2024)

### New Feature

- Add Support for SLAS private flow [#1722](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1722)

### Bug Fixes

- Fix promo codes not being properly applied in cart [#1692](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1692)
- Fix checkout shipping method fetching [#1693](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1693)
- Fix invalid query params warnings [#1655](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1655)
- Fix internal server error on account pages [#1675](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1675)
- Fix `product-item` component imports to ensure that it is overridable. [#1672](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1672)
- Fix locale selector navigating back to default locale [#1670](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1670)
- Fix handling of offline products on Cart, Checkout, Order History, and Wishlist pages [#1691](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1691)
- Fix tracking of `viewSearch` event for Einstein analytics, in the case of no-search-results [#1702](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1702)
- Remove invalid header `_sfdc_customer_id` due to recent MRT HTTP3 upgrade [#1731](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1731)

## v2.3.1 (Jan 23, 2024)

### Bug Fixes

- Fix `extract-default-translations` script [#1647](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1647)

## v2.3.0 (Jan 19, 2024)

### Accessibility improvements

- Add correct keyboard interaction behavior for variation attribute radio buttons [#1587](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1587)
- Change radio refinements (for example, filtering by Price) from radio inputs to styled buttons [#1605](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1605)
- Update search refinements ARIA labels to include "add/remove filter" [#1607](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1607)
- Improve focus behavior on my account pages, address forms, and promo codes [#1625](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1625)

### Other features

- Add local development support for node 20 [#1612](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1612)
  - Support for node 20 is not yet available on Managed Runtime
- Display selected refinements on PLP, even if the selected refinement has no hits [#1622](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1622)

## v2.2.0 (Nov 8, 2023)

### Accessibility Improvements

<!-- Order by Pull Request ID! -->
- Ensure the ListMenuTrigger component applies ARIA attributes to the correct element for the trigger icon [#1600](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1600)
- Ensure form fields and icons have accessible labels [#1526](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1526)
- Ensure active user interface components have sufficient contrast [#1534](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1534)
- Fix outline on keyboard focus [#1536](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1536/files)
- Fix improper nesting of elements in product tile [#1541](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1541)
- Ensure all interactive functionality is operable with the keyboard [#1546](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1546)
- Make security code tooltip receive keyboard focus [#1551](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1551)
- Improve accessibility of quantity picker [#1552](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1552)
- Improve keyboard accessibility of product scroller [#1559](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1559)
- Fix focus indicator for hero features links on homepage [#1561](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1561)
- Ensure color is not the sole means of communicating information [#1570](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1570)
- Improve keyboard accessibility of account menu and nav bar [#1572](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1572)

### Other Features

- Add [Active Data](https://help.salesforce.com/s/articleView?id=cc.b2c_active_data_attributes.htm&type=5) files, update pages (app index.jsx, product list and product details pages) to trigger events on product category and product detail views [#1555](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1555)
- Replace max-age with s-maxage to only cache shared caches [#1564](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1564)
- Implement gift option for basket [#1546](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1546)
- Added option to specify `isLoginPage` function to the `withRegistration` component. The default behavior is "all pages ending in `/login`". [#1572](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1572)
- Update `extract-default-messages` script to support multiple locales [#1574](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1574)
- Update engine compatibility to include npm 10 [#1597](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1597)
- Add support for localization in icon component [#1609](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1609)

### Bug Fixes

- Fix checkout allowing you to proceed to review with invalid billing address [#1632](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1632)
- Fix password change functionality [#1634](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1634)
- Remove internal linter rule that is missing in generated projects [#1554](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1554)
- Fix bug where you can add duplicates of the same item to the wishlist. Also fixes bug where skeleton appears when removing last item from the wishlist. [#1560](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1560)
- Replace max-age with s-maxage to only cache shared caches [#1564](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1564)
- Fix PLP filters for mobile [#1565](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1565)

## v2.1.1 (Nov 7, 2023)

- Use the new opt-in mechanism for enforcing the default security headers required by PWA Kit projects. [#1528](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1528)

## v2.1.0 (Nov 3, 2023)

- Support Storefront Preview
  - [#1413](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1413)
  - [#1440](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1440)
- Show discounted and strikethrough prices when there is a promotion on product detail page [1455](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1455)
- Move Content-Security-Policy logic to pwa-kit-runtime [1457](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1457)

## v2.0.0 (Sep 21, 2023)

- V3 Fix checkout card number [#1424](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1424)
- Cleanup wrong import path for page-designer component [#1441](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1441) @clavery
- Modularize country code source for targeting via extensibility [#1445](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1445) @bfeister
- Export icon helper function for target via overrides [#1420](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1420) @cbrother-csu
- Migrate Page Designer core types to commerce-sdk-react [#1441](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1441) @clavery

## v1.0.1 (Jul 26, 2023)

- Fix price display when a discounted price is zero [#1361](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1361)
- Fix price adjustments of a line item when more than one is present [#1362](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1362)
- Registered user checkout should set order with an email [#1363](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1363)

## v1.0.0 (June 15, 2023)

- First public release of package on npm under `@salesforce/retail-react-app`
- Upgrade React v18, React DOM v18, React-hook-form v7, and Chakra 2 libraries [#1166](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1166)
- Add app `above-header` and product-list `above-page-header` convenience components [#1183](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1183)
- Migration to "hooks" / `@salesforce/commerce-sdk-react` integration follow the [upgrade guide](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/upgrade-to-v3.html) and [view the diff](https://github.com/SalesforceCommerceCloud/pwa-kit/compare/release-2.7.x...release-3.0.x?diff=unified#files_bucket)

## Older Versions Without Namespace

The versions published below were not published on npm, and the versioning matched that of the PWA Kit SDK. These versions did not use the `@salesforce` namespace.

### v2.7.1 (May 11, 2023)

- Replace invalid row value with nowrap [#1179](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1179)
- Add a redirect to login page after user signs out from checkout page [#1172](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1172)
- PWA Kit should have a mechanism for replacing the access token when a SFRA login state is changed [#1171](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1171)
- Added session bridge call to login for phased launch [#1159](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1159)
- Fix Page Designer ImageWithText Link component [#1092](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1092)
- Remove site alias and locale from location.state.directedFrom path [#1065)](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1065)
- Product list refinements [#957](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/957)
- Prevent modal to open when it fails to add an item to cart [#1053](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1053)
- Make `mergeBasket` conditional more robust [#1048](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1048)
- Fix addresses not having preferred address first. [#1051](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1051)
- Changed type of the phone number field to bring up numberic keyboard on mobile devices - W-9871940 [#1016)](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1016)

### v2.7.0 (Mar 03, 2023)

- Add Page Designer ImageTile component [#967](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/967)
- Add Page Designer ImageWithText component [#991](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/991)
- Add Page Designer carousel component [#977](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/977)
- Add Page Designer layout components [#993](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/993)
- Support the product-set type [#1019](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1019)

### v2.6.0 (Jan 25, 2023)

- Mega menu fixes [#875](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/875) and [#910](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/910)
- Cache SLAS callback using request processor [#884](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/884)
- Fix padding of footer drawer component [#899](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/899)
- Update createOrder to send SLAS USID [#920](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/920)
- Fix PropTypes [#924](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/924)
- Remove unnecessary map statement [#929](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/929)

### v2.5.0 (Jan 5, 2023)

- Add instanceType to Einstein activity body [#858](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/858)
- Do not use a proxy to call Einstein [#857](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/857)
- Einstein handle variants [#867](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/867)
- Fix cc exp year [#874](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/874)

### v2.4.0 (Dec 1, 2022)

- Dynamic footer Copyright date [#741](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/741)
- Footer copyright: remove the remaining hardcoded year [#760](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/760)
- ImageGallery uses image.link when DIS is not set [#786](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/786)
- Use default locale as target if none is specified [#788](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/788)
- Password change bug fix [#803](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/803)
- pwa-kit-dev command for tailing logs [#789](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/789)
- Update usages of zzrf-001 ODS instance to the new short URL format [#816](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/816)

### v2.3.0 (Oct 27, 2022)

- Fix locale `alias` by including `locale` object inside the MultiSite Context. [#716](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/716)
- Updated translations. [#725](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/725)
- Add new Einstein API activities. [#714](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/714)
- Fix search field to recognize `“&”` character. [#736](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/736)
- Fix filters on search results page. [#742](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/742)
- Dynamic footer copyright date. [#741](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/741)
- Bugfix: image gallery thumbnails not working without DIS [#786](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/786)
- Ensure that a valid target locale is use if none is provided [#788](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/788)

### v2.2.0 (Aug 25, 2022)

- Update zzrf-001 url [#694](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/694)
- Optimize Server-side performance [#667](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/667)
- Remove references to session bridging [#684](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/684)

### v2.1.0 (Jul 05, 2022)

- Update translations [#643](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/643)
- Update translations [#653](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/653)
- Add bundlesize test back into CI [#652](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/652)
- Fix UI bug on notifications badge [#620](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/620)

### v2.0.0 (May 16, 2022)

- Update translation docs [#570](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/570)
- Fixed loading correct amount of skeletons [#576] (<https://github.com/SalesforceCommerceCloud/pwa-kit/pull/576>)
- Remove manifest path [#582](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/582)
- Fix Verbose ShellJS Command [#588](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/588)
- Drop node 12 support for [#589](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/589)
- Multi-site, Fix the case when no site aliases is set [#551](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/551)
- Fix invalid refresh token [#528](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/528)
- Add valid token check before using refresh token on login [#533](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/533)
- Fix localization scripts to output to the correct default locale [#539](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/539)
- Merge guest cart and registered cart [#540](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/540)
- Move retail react app jest setup out from pwa-kit-dev [#545](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/545)
- Remove legacy remote proxy, which allowed remote environments to use proxy configs in package.json [#425](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/425)
- Rename 'pwa' directory into 'template-retail-react-app' [#485](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/485)
- Optimize visibility-off.svg [#512](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/512)
- Support Multi-site implementation using dynamic config [#469](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/469)
- Service worker loading for dev server [#464](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/464)
- Environment Specific Configuration Support [#477](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/447)

### v1.5.0 (Mar 17, 2022)

- Support storing authentication tokens in cookie [#429](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/429)
- Make sure the forgot-password modal also shows up in the checkout flow [#373](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/373)
- On Windows, the locale selector dropdown in the footer now showing all of the options properly [#381](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/381)
- Import cross-fetch to make OCAPI client isomorphic [#382](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/382)
- Multi-site implementation for Retail React App [#391](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/391)

### v1.4.0 (Jan 27, 2022)

- Do not send HSTS header during local development [#288](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/288)
- Add constants for `<meta>` tags `theme-color` and `apple-mobile-web-app-title` [#287](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/287)
- Upgrade to React 17 [#278](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/278)
- Import preliminary translations [#324](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/324)
- Remove old dependencies that are no longer used [#317](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/317)

### v1.3.0 (Jan 06, 2022)

- Remove Einstein from home page [#208](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/208)
- Add git2gus config to allow git2gus integration [210](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/210)
- Set common HTTP security headers [#263](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/263)
- Add message ids to all the translated text, so they provide context for the translators [#239](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/239) [#207](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/207) [#195](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/195)
- Minor translation fixes [260](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/260) [#252](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/252)
- Provide Url Customization for the Retail React App [#228](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/228/files)
- Add an image component to allow for easier-implementation of responsive images [#186](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/186)
- Add shop Products section with products from the Catalog [#216](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/216)
- Remove `upgrade-insecure-requests` for local development [#270](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/270)
- Fix the missing out-of-stock message on mobile screens [#231](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/231)
- Fix order summary prices on the check out page misaligned on mobile [#233](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/233)
- Skip irrelevant jobs on CI on forked PR [#237](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/237) [#240](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/240)
- Add webpack plugin [#255](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/255)
- Combine config files [#256](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/256)
- Improve unsupported locale error message [#225](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/225)
- Add github template [#226](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/226)
- Fix shipping method description overflows the price section [#232](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/232)
- Fix show applied promotion codes case sensitive issue [#224](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/224)
- Fix section subtitle incorrect prop warning [#282](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/282)

### v1.2.0 (Nov 18, 2021)

- Simplify homepage for Retail React App [#201](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/201)
- Ensure `cookieId` value is sent always for Einstein recommendations [#179](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/179)
- Remove `x-powered-by` HTTP response header [#165](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/165)
- For search engine crawlers, add `hreflang` links to the current page's html [#137](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/137)
- Use the preferred currency when switching locales. [#105](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/105)
- Integrate wishlist with einstein recommended products. [#131](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/131)
- When adding a new locale, minimize configuring the locale selector UI by having a list of commonly-used locales [#175](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/175)
- Enable adding wishlist item to the cart. [#158](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/158)
- Rename CartItemVariant to ItemVariantProvider [#155](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/155)
- Enabling pseudo locale now affects only the loading of the translation messages. The rest of the app still knows about English and the other locales. [#177](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/177)
- Allow individual Commerce API calls to pass in a different locale/currency and override the global value. [#177](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/177)
- Fix regression with loading the correct translation file [#193](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/193)
- Upgrade `chakra-ui/react` to `^1.7.1` version. [#204](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/204)
- Rename the `extract-messages` and `compile-messages` commands to `extract-default-translations` and `compile-translations` [#160](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/160)
- Enable favourite icons on product tiles for guest users [#173](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/173)
- Fix Missing Locale Param for Commerce API Calls [#174](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/174)
- Add cache control header to product details page [#172](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/172)
- Clear SLAS tokens when OID is changed [#178](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/178)

### v1.1.0 (Sep 27, 2021)

- Fix wishlist bugs and provide better hooks for wishlist features. [#64](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/64)
- Lazy load Popover component. [#134](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/134)
- Fix pseudo local command to use `en-XB`. [#101](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/101)
- Ensure generated projects ship with a working .gitignore file. [#95](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/95)
- Remove eslint rule which check for Salesforce copyright. [#104](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/104)
- Improve error page design. [#74](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/74)
- Localize cart and checkout messages. [#106](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/106)
- Add default cache control header to home page. [#103](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/103)
- Security - `inquirer` package upgrade. [#121](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/121)
- New quantity picker. [#102](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/102)

### v1.0.0 (Sep 08, 2021)

- PWA Kit General Availability and open source. 🎉
