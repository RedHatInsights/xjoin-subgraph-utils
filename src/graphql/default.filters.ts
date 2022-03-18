import {FILTER_TYPES} from "./types.js";
import {GraphQLInput, GraphQLInputField} from "./graphqlschema.js";

interface DefaultFilter {
    name: string,
    input: GraphQLInput,
    buildESFilter: {(filterKey: string, filterValue: Record<any, any>, root: string): Record<any, any>}
}

export class DefaultFilters {
    filters: DefaultFilter[] = []

    constructor() {
        const filterTimestampInput = new GraphQLInput(FILTER_TYPES.FILTER_TIMESTAMP);
        filterTimestampInput.addField(new GraphQLInputField('lt', 'String'));
        filterTimestampInput.addField(new GraphQLInputField('lte', 'String'));
        filterTimestampInput.addField(new GraphQLInputField('gt', 'String'));
        filterTimestampInput.addField(new GraphQLInputField('gte', 'String'));
        filterTimestampInput.addField(new GraphQLInputField('eq', 'String'));
        this.filters.push({
            name: FILTER_TYPES.FILTER_TIMESTAMP,
            input: filterTimestampInput,
            buildESFilter: this.rangeFilter
        });

        const filterIntInput = new GraphQLInput(FILTER_TYPES.FILTER_INT);
        filterIntInput.addField(new GraphQLInputField('lt', 'Int'));
        filterIntInput.addField(new GraphQLInputField('lte', 'Int'));
        filterIntInput.addField(new GraphQLInputField('gt', 'Int'));
        filterIntInput.addField(new GraphQLInputField('gte', 'Int'));
        this.filters.push({
            name: FILTER_TYPES.FILTER_INT,
            input: filterIntInput,
            buildESFilter: this.rangeFilter
        })

        const filterStringInput = new GraphQLInput(FILTER_TYPES.FILTER_STRING);
        filterStringInput.addField(new GraphQLInputField('eq', 'String'));
        this.filters.push({
            name: FILTER_TYPES.FILTER_STRING,
            input: filterStringInput,
            buildESFilter: (filterKey: string, filterValue: Record<any, any>, root: string) => {
                return {
                    term: {
                        [root.toLowerCase() + '.' + filterKey]: filterValue.eq
                    }
                };
            }
        })

        const filterStringArrayInput = new GraphQLInput(FILTER_TYPES.FILTER_STRING_ARRAY);
        filterStringArrayInput.addField(new GraphQLInputField('contains_all', '[String]'));
        filterStringArrayInput.addField(new GraphQLInputField('contains_any', '[String]'));
        this.filters.push({
            name: FILTER_TYPES.FILTER_STRING_ARRAY,
            input: filterStringArrayInput,
            buildESFilter: (filterKey: string, filterValue: Record<any, any>, root: string) => {
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
                    return {}
                }
            }
        })

        const filterBooleanInput = new GraphQLInput(FILTER_TYPES.FILTER_BOOLEAN);
        filterBooleanInput.addField(new GraphQLInputField('is', 'Boolean'));
        this.filters.push({
            name: FILTER_TYPES.FILTER_BOOLEAN,
            input: filterBooleanInput,
            buildESFilter: (filterKey: string, filterValue: Record<any, any>, root: string) => {
                return {
                    term: {
                        [root.toLowerCase() + '.' + filterKey]: filterValue.is
                    }
                };
            }
        })

        const aggregationFilter = new GraphQLInput(FILTER_TYPES.AGGREGATION_FILTER);
        aggregationFilter.addField(new GraphQLInputField('search', FILTER_TYPES.FILTER_STRING))
        this.filters.push({
            name: FILTER_TYPES.AGGREGATION_FILTER,
            input: aggregationFilter,
            buildESFilter: () => {
                return {}
            }
        });
    }

    getFilter(filterName: string): DefaultFilter {
       const response = this.filters.find( ({ name }) => name === filterName);
       if (response === undefined) {
           throw new Error("unable to locate filter: " + filterName)
       }
       return response;
    }

    hasFilter(filterName: string): boolean {
        const response = this.filters.find( ({ name }) => name === filterName);
        return response !== undefined;

    }

    rangeFilter(filterKey: string, filterValue: Record<any, any>, root: string): Record<any, any> {
        const fullFilterKey = root.toLowerCase() + '.' + filterKey;
        const esFilter: any = {};

        if (filterValue.eq !== undefined) {
            esFilter.term = {
                [root.toLowerCase() + '.' + filterKey]: filterValue.eq
            };
        } else {
            esFilter.range = {
                [fullFilterKey]: {}
            }
            if (filterValue.lt !== undefined) {
                esFilter.range[fullFilterKey].lt = filterValue.lt
            }

            if (filterValue.lte !== undefined) {
                esFilter.range[fullFilterKey].lte = filterValue.lte
            }

            if (filterValue.gt !== undefined) {
                esFilter.range[fullFilterKey].gt = filterValue.gt
            }

            if (filterValue.gte !== undefined) {
                esFilter.range[fullFilterKey].gte = filterValue.gte
            }
        }
        return esFilter;
    }
}