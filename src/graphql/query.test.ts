import 'reflect-metadata';
import {graphqlFiltersToESFilters, graphqlSelectionToESSourceFields} from "./query.js";
import {SelectionNode} from "graphql";
import {Kind} from "graphql/language/kinds";
import {AvroSchemaParser} from "../avro";
import {loadAvroSchemaFromFile} from "../test/utils.js";

describe('graphqlSelectionToESSourceFields', () => {
    test('converts a single field', () => {
        const selectionSet: SelectionNode[] = [{
            kind: Kind.FIELD,
            name: {
                kind: Kind.NAME,
                value: 'id'
            }
        }];

        const sourceFields = graphqlSelectionToESSourceFields(['host'], selectionSet);
        expect(sourceFields).toEqual(['host.id']);
    });

    test('converts a multiple fields', () => {
        const selectionSet: SelectionNode[] = [{
            kind: Kind.FIELD,
            name: {
                kind: Kind.NAME,
                value: 'id'
            }
        }, {
            kind: Kind.FIELD,
            name: {
                kind: Kind.NAME,
                value: 'account'
            }
        }, {
            kind: Kind.FIELD,
            name: {
                kind: Kind.NAME,
                value: 'display_name'
            }
        }];

        const sourceFields = graphqlSelectionToESSourceFields(['host'], selectionSet);
        expect(sourceFields).toEqual(['host.id', 'host.account', 'host.display_name']);
    });

    test('converts a nested field', () => {
        const selectionSet: SelectionNode[] = [{
            kind: Kind.FIELD,
            name: {
                kind: Kind.NAME,
                value: 'system_profile_facts',
            },
            selectionSet: {
                kind: Kind.SELECTION_SET,
                selections: [{
                    kind: Kind.FIELD,
                    name: {
                        kind: Kind.NAME,
                        value: 'reporter'
                    }
                }]
            }
        }];

        const sourceFields = graphqlSelectionToESSourceFields(['host'], selectionSet);
        expect(sourceFields).toEqual(['host.system_profile_facts.reporter']);
    });

    test('converts a deeply nested field', () => {
        const selectionSet: SelectionNode[] = [{
            kind: Kind.FIELD,
            name: {
                kind: Kind.NAME,
                value: 'system_profile_facts',
            },
            selectionSet: {
                kind: Kind.SELECTION_SET,
                selections: [{
                        kind: Kind.FIELD,
                        name: {
                            kind: Kind.NAME,
                            value: 'operating_system'
                        },
                        selectionSet: {
                            kind: Kind.SELECTION_SET,
                            selections: [{
                                    kind: Kind.FIELD,
                                    name: {
                                        kind: Kind.NAME,
                                        value: 'major'
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }];

        const sourceFields = graphqlSelectionToESSourceFields(['host'], selectionSet);
        expect(sourceFields).toEqual(['host.system_profile_facts.operating_system.major']);
    });

    test('converts fields when parent is empty', () => {
        const selectionSet: SelectionNode[] = [{
            kind: Kind.FIELD,
            name: {
                kind: Kind.NAME,
                value: 'id'
            }
        }, {
            kind: Kind.FIELD,
            name: {
                kind: Kind.NAME,
                value: 'account'
            }
        }, {
            kind: Kind.FIELD,
            name: {
                kind: Kind.NAME,
                value: 'system_profile_facts',
            },
            selectionSet: {
                kind: Kind.SELECTION_SET,
                selections: [{
                    kind: Kind.FIELD,
                    name: {
                        kind: Kind.NAME,
                        value: 'operating_system'
                    },
                    selectionSet: {
                        kind: Kind.SELECTION_SET,
                        selections: [{
                            kind: Kind.FIELD,
                            name: {
                                kind: Kind.NAME,
                                value: 'major'
                            }
                        }
                        ]
                    }
                }
                ]
            }
        }];

        const sourceFields = graphqlSelectionToESSourceFields([], selectionSet);
        expect(sourceFields).toEqual(['id', 'account', 'system_profile_facts.operating_system.major']);
    });


    test('throws an error when field kind is not field', () => {
        const selectionSet: SelectionNode[] = [{
            kind: Kind.FRAGMENT_SPREAD,
            name: {
                kind: Kind.NAME,
                value: 'id'
            }
        }];
        expect(() => {
            graphqlSelectionToESSourceFields([], selectionSet);
        }).toThrow(`invalid selection kind: ${Kind.FRAGMENT_SPREAD}`);
    });
});

describe('graphqlFiltersToESFilters', () => {
    test('converts a single filter', async () => {
        const queryFilters = {
            id: {
                eq: 'test'
            }
        };
        const avroSchemaParser = new AvroSchemaParser(loadAvroSchemaFromFile('minimum.valid.host'));
        const gqlSchema = avroSchemaParser.convertToGraphQL();

        const filters = graphqlFiltersToESFilters(['host'], queryFilters, gqlSchema);
        expect(filters).toEqual([{
            "term": {
                "host.id": "test"
            }
        }]);
    });

    test('converts multiple filters', async () => {
        const queryFilters = {
            id: {
                eq: 'test.id'
            },
            account: {
                eq: 'test.account'
            }
        };
        const avroSchemaParser = new AvroSchemaParser(loadAvroSchemaFromFile('host'));
        const gqlSchema = avroSchemaParser.convertToGraphQL();

        const filters = graphqlFiltersToESFilters(['host'], queryFilters, gqlSchema);
        expect(filters).toEqual([{
            term: {
                'host.id': 'test.id'
            }
        }, {
            term: {
                'host.account': 'test.account'
            }
        }]);
    });

    test('converts a nested filter', async () => {
        const queryFilters = {
            system_profile_facts: {
                operating_system: {
                    major: {
                        eq: '8'
                    }
                }
            }
        };
        const avroSchemaParser = new AvroSchemaParser(loadAvroSchemaFromFile('host'));
        const gqlSchema = avroSchemaParser.convertToGraphQL();

        const filters = graphqlFiltersToESFilters(['host'], queryFilters, gqlSchema);
        expect(filters).toEqual([{
            term: {
                'host.system_profile_facts.operating_system.major': '8'
            }
        }]);
    });

    test('converts multiple nested filters', async () => {
        const queryFilters = {
            system_profile_facts: {
                operating_system: {
                    major: {
                        eq: '8'
                    }
                }
            },
            id: {
                eq: 'test.id'
            },
            account: {
                eq: 'test.account'
            },
            canonical_facts: {
                fqdn: {
                    eq: 'bar'
                }
            }
        };
        const avroSchemaParser = new AvroSchemaParser(loadAvroSchemaFromFile('host'));
        const gqlSchema = avroSchemaParser.convertToGraphQL();

        const filters = graphqlFiltersToESFilters(['host'], queryFilters, gqlSchema);
        expect(filters).toEqual([{
            term: {
                'host.system_profile_facts.operating_system.major': '8'
            }
        }, {
            term: {
                'host.id': 'test.id'
            }
        }, {
            term: {
                'host.account': 'test.account'
            }
        }, {
            term: {
                'host.canonical_facts.fqdn': 'bar'
            }
        }]);
    });

    test('throws an error if filter name is invalid', async () => {
        const queryFilters = {
            canonical_facts: {
                invalid: {
                    eq: 'nope'
                }
            }
        };
        const avroSchemaParser = new AvroSchemaParser(loadAvroSchemaFromFile('host'));
        const gqlSchema = avroSchemaParser.convertToGraphQL();

        expect(() => {
            graphqlFiltersToESFilters(['host'], queryFilters, gqlSchema);
        }).toThrow(`unable to find field: invalid on GraphQLInput CanonicalFactsFilter`);
    });
});
