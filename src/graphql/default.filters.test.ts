import 'reflect-metadata';
import {DefaultFilters} from "./default.filters.js";
import {GRAPHQL_FILTER_TYPES} from "./types";
import {GraphQLInput, GraphQLInputField} from "./graphqlschema";
import {graphqlFiltersToESFilters} from "./query";

describe('constructor', () => {
    test('adds FilterTimestamp', () => {
        const defaultFilters = new DefaultFilters();

        const input = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_TIMESTAMP);
        input.addField(new GraphQLInputField('lt', 'String'));
        input.addField(new GraphQLInputField('lte', 'String'));
        input.addField(new GraphQLInputField('gt', 'String'));
        input.addField(new GraphQLInputField('gte', 'String'));
        input.addField(new GraphQLInputField('eq', 'String'));

        expect(defaultFilters.filters).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: GRAPHQL_FILTER_TYPES.FILTER_TIMESTAMP,
                    input: input,
                    buildESFilter: defaultFilters.rangeFilter
                })
            ])
        )
    });

    test('adds FilterInt', () => {
        const defaultFilters = new DefaultFilters();

        const filterIntInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_INT);
        filterIntInput.addField(new GraphQLInputField('lt', 'Int'));
        filterIntInput.addField(new GraphQLInputField('lte', 'Int'));
        filterIntInput.addField(new GraphQLInputField('gt', 'Int'));
        filterIntInput.addField(new GraphQLInputField('gte', 'Int'));

        expect(defaultFilters.filters).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: GRAPHQL_FILTER_TYPES.FILTER_INT,
                    input: filterIntInput,
                    buildESFilter: defaultFilters.rangeFilter
                })
            ])
        )
    });

    test('adds FilterString', () => {
        const defaultFilters = new DefaultFilters();

        const filterStringInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_STRING);
        filterStringInput.addField(new GraphQLInputField('eq', 'String'));

        expect(defaultFilters.filters).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: GRAPHQL_FILTER_TYPES.FILTER_STRING,
                    input: filterStringInput,
                    buildESFilter: defaultFilters.stringFilter
                })
            ])
        )
    });

    test('adds FilterStringArray', () => {
        const defaultFilters = new DefaultFilters();

        const filterStringArrayInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_STRING_ARRAY);
        filterStringArrayInput.addField(new GraphQLInputField('contains_all', '[String]'));
        filterStringArrayInput.addField(new GraphQLInputField('contains_any', '[String]'));

        expect(defaultFilters.filters).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: GRAPHQL_FILTER_TYPES.FILTER_STRING_ARRAY,
                    input: filterStringArrayInput,
                    buildESFilter: defaultFilters.stringArrayFilter
                })
            ])
        )
    });

    test('adds FilterBoolean', () => {
        const defaultFilters = new DefaultFilters();

        const filterBooleanInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_BOOLEAN);
        filterBooleanInput.addField(new GraphQLInputField('is', 'Boolean'));

        expect(defaultFilters.filters).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: GRAPHQL_FILTER_TYPES.FILTER_BOOLEAN,
                    input: filterBooleanInput,
                    buildESFilter: defaultFilters.booleanFilter
                })
            ])
        );
    });

    test('adds EnumerationFilter', () => {
        const defaultFilters = new DefaultFilters();

        const enumerationFilter = new GraphQLInput(GRAPHQL_FILTER_TYPES.ENUMERATION_FILTER);
        enumerationFilter.addField(new GraphQLInputField('search', GRAPHQL_FILTER_TYPES.FILTER_STRING))

        expect(defaultFilters.filters).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: GRAPHQL_FILTER_TYPES.ENUMERATION_FILTER,
                    input: enumerationFilter,
                    buildESFilter: defaultFilters.enumerationFilter
                })
            ])
        );
    });
});

describe('getFilter', () => {
    test('returns a filter', () => {
        const defaultFilters = new DefaultFilters();
        const filterStringInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_STRING);
        filterStringInput.addField(new GraphQLInputField('eq', 'String'));

        const stringFilter = defaultFilters.getFilter('FilterString');
        expect(stringFilter).toEqual({
            name: GRAPHQL_FILTER_TYPES.FILTER_STRING,
            input: filterStringInput,
            buildESFilter: defaultFilters.stringFilter
        })
    });

    test('throws an error when filter is not found', () => {
        const defaultFilters = new DefaultFilters();
        expect(() => {
            defaultFilters.getFilter('FilterInvalid');
        }).toThrow('unable to locate filter: FilterInvalid');
    });
});

describe('hasFilter', () => {
    test('returns true when filter is found', () => {
        const defaultFilters = new DefaultFilters();
        const hasFilter = defaultFilters.hasFilter('FilterString');
        expect(hasFilter).toBe(true);
    });

    test('returns false when filter is not found', () => {
        const defaultFilters = new DefaultFilters();
        const hasFilter = defaultFilters.hasFilter('FilterInvalid');
        expect(hasFilter).toBe(false);
    });
});

describe('rangeFilter', () => {
    test('converts graphql lte filter to elasticsearch query', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.rangeFilter('account', {'lte': '1234'}, 'Host');
        expect(esFilter).toEqual({
            range: {
                'host.account': {
                    lte: '1234'
                }
            }
        });
    });

    test('converts graphql lt filter to elasticsearch query', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.rangeFilter('account', {'lt': '1234'}, 'Host');
        expect(esFilter).toEqual({
            range: {
                'host.account': {
                    lt: '1234'
                }
            }
        });
    });

    test('converts graphql gt filter to elasticsearch query', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.rangeFilter('account', {'gt': '1234'}, 'Host');
        expect(esFilter).toEqual({
            range: {
                'host.account': {
                    gt: '1234'
                }
            }
        });
    });

    test('converts graphql gte filter to elasticsearch query', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.rangeFilter('account', {'gte': '1234'}, 'Host');
        expect(esFilter).toEqual({
            range: {
                'host.account': {
                    gte: '1234'
                }
            }
        });
    });

    test('converts graphql eq filter to elasticsearch query', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.rangeFilter('account', {'eq': '1234'}, 'Host');
        expect(esFilter).toEqual({
            term: {
                'host.account': '1234'
            }
        });
    });

    test('converts complex graphql range filter to elasticsearch query', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.rangeFilter('account', {
            lte: '1234',
            gte: '2345',
            lt: '3456',
            gt: '4567'
        }, 'Host');
        expect(esFilter).toEqual({
            range: {
                'host.account': {
                    lte: '1234',
                    gte: '2345',
                    lt: '3456',
                    gt: '4567'
                }
            }
        });
    });
})

describe('stringFilter', () => {
    test('converts basic graphql filter into es filter', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.stringFilter('account', {eq: 'foo'}, 'Host');
        expect(esFilter).toEqual({term: {'host.account': 'foo'}});
    });

    test('throws an error if filter is missing eq clause', () => {
        const defaultFilters = new DefaultFilters();
        expect(() => {
            const esFilter = defaultFilters.stringFilter('account', {foo: 'foo'}, 'Host');
        }).toThrow('string filter must contain an eq clause: account');
    });
})

describe('booleanFilter', () => {
    test('converts basic graphql filter into es filter', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.booleanFilter('account', {is: true}, 'Host');
        expect(esFilter).toEqual({term: {'host.account': true}});
    });

    test('throws an error if filter is missing is clause', () => {
        const defaultFilters = new DefaultFilters();
        expect(() => {
            defaultFilters.booleanFilter('account', {foo: true}, 'Host');
        }).toThrow('boolean filter must contain an is clause: account');
    });
})

describe('stringArrayFilter', () => {
    test('converts contains_all graphql filter into es filter', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.stringArrayFilter('account', {contains_all: ["foo", "bar"]}, 'Host');
        expect(esFilter).toEqual({
            terms_set: {
                'host.account': {
                    terms: ["foo", "bar"],
                    minimum_should_match_script: {
                        source: 'params.num_terms'
                    }
                }
            }
        });
    });

    test('converts contains_any graphql filter into es filter', () => {
        const defaultFilters = new DefaultFilters();
        const esFilter = defaultFilters.stringArrayFilter('account', {contains_any: ["foo", "bar"]}, 'Host');
        expect(esFilter).toEqual({
            terms: {
                'host.account': ["foo", "bar"]
            }
        });
    });

    test('throws an error if filter is missing clause', () => {
        const defaultFilters = new DefaultFilters();
        expect(() => {
            defaultFilters.stringArrayFilter('account', {foo: ["foo", "bar"]}, 'Host');
        }).toThrow('string array filter must contain one of [contains_all, contains_any]: account');
    });
})