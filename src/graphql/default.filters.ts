import {GRAPHQL_FILTER_TYPES} from "./types.js";
import {GraphQLInput, GraphQLInputField} from "./graphqlschema.js";

interface DefaultFilter {
    name: string,
    input: GraphQLInput,
    buildESFilter: { (filterKey: string, filterValue: Record<any, any>, root: string): Record<any, any> }
}

export class DefaultFilters {
    filters: DefaultFilter[] = []

    constructor() {
        const filterTimestampInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_TIMESTAMP);
        filterTimestampInput.addField(new GraphQLInputField('lt', 'String'));
        filterTimestampInput.addField(new GraphQLInputField('lte', 'String'));
        filterTimestampInput.addField(new GraphQLInputField('gt', 'String'));
        filterTimestampInput.addField(new GraphQLInputField('gte', 'String'));
        filterTimestampInput.addField(new GraphQLInputField('eq', 'String'));
        this.filters.push({
            name: GRAPHQL_FILTER_TYPES.FILTER_TIMESTAMP,
            input: filterTimestampInput,
            buildESFilter: this.rangeFilter
        });

        const filterIntInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_INT);
        filterIntInput.addField(new GraphQLInputField('lt', 'Int'));
        filterIntInput.addField(new GraphQLInputField('lte', 'Int'));
        filterIntInput.addField(new GraphQLInputField('gt', 'Int'));
        filterIntInput.addField(new GraphQLInputField('gte', 'Int'));
        this.filters.push({
            name: GRAPHQL_FILTER_TYPES.FILTER_INT,
            input: filterIntInput,
            buildESFilter: this.rangeFilter
        });

        const filterStringInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_STRING);
        filterStringInput.addField(new GraphQLInputField('eq', 'String'));
        this.filters.push({
            name: GRAPHQL_FILTER_TYPES.FILTER_STRING,
            input: filterStringInput,
            buildESFilter: this.stringFilter
        })

        const filterStringArrayInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_STRING_ARRAY);
        filterStringArrayInput.addField(new GraphQLInputField('contains_all', '[String]'));
        filterStringArrayInput.addField(new GraphQLInputField('contains_any', '[String]'));
        this.filters.push({
            name: GRAPHQL_FILTER_TYPES.FILTER_STRING_ARRAY,
            input: filterStringArrayInput,
            buildESFilter: this.stringArrayFilter
        })

        const filterBooleanInput = new GraphQLInput(GRAPHQL_FILTER_TYPES.FILTER_BOOLEAN);
        filterBooleanInput.addField(new GraphQLInputField('is', 'Boolean'));
        this.filters.push({
            name: GRAPHQL_FILTER_TYPES.FILTER_BOOLEAN,
            input: filterBooleanInput,
            buildESFilter: this.booleanFilter
        })

        const enumerationFilter = new GraphQLInput(GRAPHQL_FILTER_TYPES.ENUMERATION_FILTER);
        enumerationFilter.addField(new GraphQLInputField('search', GRAPHQL_FILTER_TYPES.FILTER_STRING))
        this.filters.push({
            name: GRAPHQL_FILTER_TYPES.ENUMERATION_FILTER,
            input: enumerationFilter,
            buildESFilter: this.enumerationFilter
        });
    }

    getFilter(filterName: string): DefaultFilter {
        const response = this.filters.find(({name}) => name === filterName);
        if (response === undefined) {
            throw new Error("unable to locate filter: " + filterName)
        }
        return response;
    }

    hasFilter(filterName: string): boolean {
        const response = this.filters.find(({name}) => name === filterName);
        return response !== undefined;
    }

    /**
     * Convert a GraphQL filter Value to an Elasticsearch filter
     */
    rangeFilter(filterKey: string, gqlFilterValue: Record<any, any>, root: string): Record<any, any> {
        const fullFilterKey = root.toLowerCase() + '.' + filterKey;
        const esFilter: any = {};

        if (gqlFilterValue.eq !== undefined) {
            esFilter.term = {
                [root.toLowerCase() + '.' + filterKey]: gqlFilterValue.eq
            };
        } else {
            esFilter.range = {
                [fullFilterKey]: {}
            }
            if (gqlFilterValue.lt !== undefined) {
                esFilter.range[fullFilterKey].lt = gqlFilterValue.lt
            }

            if (gqlFilterValue.lte !== undefined) {
                esFilter.range[fullFilterKey].lte = gqlFilterValue.lte
            }

            if (gqlFilterValue.gt !== undefined) {
                esFilter.range[fullFilterKey].gt = gqlFilterValue.gt
            }

            if (gqlFilterValue.gte !== undefined) {
                esFilter.range[fullFilterKey].gte = gqlFilterValue.gte
            }
        }
        return esFilter;
    }

    stringFilter(filterKey: string, filterValue: Record<any, any>, root: string) {
        if (!filterValue.eq) {
            throw new Error(`string filter must contain an eq clause: ${filterKey}`);
        }

        return {
            term: {
                [root.toLowerCase() + '.' + filterKey]: filterValue.eq
            }
        };
    }

    booleanFilter(filterKey: string, filterValue: Record<any, any>, root: string) {
        if (!filterValue.is) {
            throw new Error(`boolean filter must contain an is clause: ${filterKey}`);
        }

        return {
            term: {
                [root.toLowerCase() + '.' + filterKey]: filterValue.is
            }
        };
    }

    stringArrayFilter(filterKey: string, filterValue: Record<any, any>, root: string) {
        if (filterValue.contains_all) {
            return {
                terms_set: {
                    [root.toLowerCase() + '.' + filterKey]: {
                        terms: filterValue.contains_all,
                        minimum_should_match_script: {
                            source: 'params.num_terms'
                        }
                    }
                }
            }
        } else if (filterValue.contains_any) {
            return {
                'terms': {
                    [root.toLowerCase() + '.' + filterKey]: filterValue.contains_any
                }
            }
        } else {
            throw new Error(`string array filter must contain one of [contains_all, contains_any]: ${filterKey}`);
        }
    }

    enumerationFilter() {
        return {}
    }
}