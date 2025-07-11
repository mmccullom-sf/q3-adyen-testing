/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

// Project Components
import Link from '@salesforce/retail-react-app/app/components/link'

// Components
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    Text,

    // Hooks
    useStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Icons
import {ChevronDownIcon, ChevronRightIcon} from '@salesforce/retail-react-app/app/components/icons'

/**
 * The nested accordion allows you to create, as the name suggest, a nests
 * accordion given a hierarchical data structure. Each nests accordion will
 * be indented to further enhance the hierary view.
 */
const NestedAccordion = (props) => {
    const styles = useStyleConfig('NestedAccordion')
    const {
        item,
        initialDepth = 0,
        itemsFilter = () => true,
        itemsAfter,
        itemsBefore,
        itemsKey = 'items',
        itemsCountKey = 'count',
        fontWeights = [],
        fontSizes = [],
        urlBuilder = (item) => `/${item.id}`,
        ...rest
    } = props

    const depth = initialDepth
    const items = item[itemsKey] || []

    // Handle filters in the folr of a function or a object key string.
    const filter = (item) =>
        typeof itemsFilter === 'function' ? itemsFilter(item) : !!item[itemsFilter]

    const ItemComponent = props?.itemComponent || NestedAccordion

    return (
        <Accordion className="sf-nested-accordion" {...rest}>
            {/* Optional accordion items before others in items list.  */}
            {typeof itemsBefore === 'function' ? itemsBefore({item, depth}) : itemsBefore}

            {items.filter(filter).map((item) => {
                const {id, name} = item
                const itemsCount = item[itemsCountKey] || item[itemsKey]?.length || 0

                return (
                    <AccordionItem key={id} border="none">
                        {({isExpanded}) => (
                            <>
                                {/* Heading */}
                                <h2>
                                    {/* Show item as a leaf node if it has no visible child items. */}
                                    {itemsCount > 0 ? (
                                        <AccordionButton {...styles.internalButton}>
                                            {/* Replace default expanded/collapsed icons. */}
                                            {isExpanded ? (
                                                <ChevronDownIcon {...styles.internalButtonIcon} />
                                            ) : (
                                                <ChevronRightIcon {...styles.internalButtonIcon} />
                                            )}

                                            <Text
                                                fontSize={fontSizes[depth]}
                                                fontWeight={fontWeights[depth]}
                                            >
                                                {name}
                                            </Text>
                                        </AccordionButton>
                                    ) : (
                                        <AccordionButton
                                            {...styles.leafButton}
                                            as={Link}
                                            to={urlBuilder(item)}
                                        >
                                            <Text
                                                fontSize={fontSizes[depth]}
                                                fontWeight={fontWeights[depth]}
                                            >
                                                {name}
                                            </Text>
                                        </AccordionButton>
                                    )}
                                </h2>

                                {/* Child Items */}
                                {isExpanded && (
                                    <AccordionPanel {...styles.panel}>
                                        <ItemComponent
                                            {...styles.nestedAccordion}
                                            {...props}
                                            item={item}
                                            itemsKey={itemsKey}
                                            itemsCountKey={itemsCountKey}
                                            initialDepth={depth + 1}
                                            itemComponent={NestedAccordion}
                                            isExpanded={isExpanded}
                                        />
                                    </AccordionPanel>
                                )}
                            </>
                        )}
                    </AccordionItem>
                )
            })}

            {/* Optional accordion items after others in items list.  */}
            {typeof itemsAfter === 'function' ? itemsAfter({item, depth}) : itemsAfter}
        </Accordion>
    )
}

NestedAccordion.displayName = 'NestedAccordion'

NestedAccordion.propTypes = {
    /**
     * A POJO consistening of an id, name, and items array of object with
     * similarly specified properties.
     */
    item: PropTypes.object.isRequired,
    /**
     * An array of `AccordionItem` components that will be displayed after all
     * of the child items. Alternatively you can pass a function that will receive
     * the current item and it's depth, your should return an `AccordionItem` or
     * array of `AccordionItem`'s.
     */
    itemsAfter: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    /**
     * An array of `AccordionItem` components that will be displayed before all
     * of the child items. Alternatively you can pass a function that will receive
     * the current item and it's depth, your should return an `AccordionItem` or
     * array of `AccordionItem`'s.
     */
    itemsBefore: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    /**
     * This is an internally used property used to pass the updated depth of the
     * child accordion. This is used to access specfic styl data for accodions
     * based on their depth.
     */
    initialDepth: PropTypes.number,
    /**
     * Component to be rendered in place of the inner nested accordion.
     */
    itemComponent: PropTypes.elementType,
    /**
     * By default child items are keyed at `items` but if your data differs you
     * can specify a custom key name for chile items. (e.g. children)
     */
    itemsKey: PropTypes.string,
    /**
     * This property represents the item key that represents the count of sub-items. This is used
     * to display a leaf node of a sub nested accordion.
     */
    itemsCountKey: PropTypes.string,
    /**
     * Programatically filter out items that you do not want to show. You can do this by
     * supplying a string that will be used to access an items value, the the value is truthy
     * the item will be displayed. Otherwise you can pass a function, this function will be passed
     * the item to be filtered, its return is expected to be true or false.
     */
    itemsFilter: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    /**
     * An array of font size strings, the position in the array will
     * indicate at what depth that size is applied.
     * TODO: Think about making this optionally a string value to make it behave like
     * chakra-ui responsive properties.
     */
    fontSizes: PropTypes.array,
    /**
     * An array of font weight strings, the position in the array will
     * indicate at what depth that weight is applied.
     * TODO: Think about making this optionally a string value to make it behave like
     * chakra-ui responsive properties.
     */
    fontWeights: PropTypes.array,
    /**
     * This function builds the urls for leaf items. It accepts
     * the current item, and returns a string.
     */
    urlBuilder: PropTypes.func
}

export default NestedAccordion
