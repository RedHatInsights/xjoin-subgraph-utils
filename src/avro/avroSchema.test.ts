import 'reflect-metadata';
import {plainToInstance} from "class-transformer";
import {Field} from "./avroSchema.js";
import {AvroSchemaParser} from "./avroSchemaParser.js";
import {GRAPHQL_FILTER_TYPES, GRAPHQL_TYPES} from "../graphql/types.js";

describe('Field', () => {
    describe('Object Type', () => {
        const fieldJSON = {
            "name": "id",
            "type": {
                "type": "string",
                "xjoin.type": "string"
            }
        }

        test('correctly converts to gql string type', () => {
            const field = plainToInstance(Field, fieldJSON);
            const gqlType = field.getGraphQLType();
            expect(gqlType).toBe('String');
        });

        test('correctly converts to gql filter type', () => {
            const field = plainToInstance(Field, fieldJSON);
            const filterType = field.getFilterType();
            expect(filterType).toBe('FilterString');
        });

        test('correctly converts type with no xjoin.enumeration key', () => {
            const field = plainToInstance(Field, fieldJSON);
            const enumerationType = field.getEnumeration();
            expect(enumerationType).toBe(false);
        });

        test('correctly converts type with xjoin.enumeration: true', () => {
            fieldJSON.type['xjoin.enumeration'] = true;
            const field = plainToInstance(Field, fieldJSON);
            const enumerationType = field.getEnumeration();
            expect(enumerationType).toBe(true);
        });

        test('correctly converts type with xjoin.enumeration: false', () => {
            fieldJSON.type['xjoin.enumeration'] = false;
            const field = plainToInstance(Field, fieldJSON);
            const enumerationType = field.getEnumeration();
            expect(enumerationType).toBe(false);
        });

        test('correctly converts type with no xjoin.primary.key', () => {
            const field = plainToInstance(Field, fieldJSON);
            const primaryKey = field.getPrimaryKey();
            expect(primaryKey).toBe(false);
        });

        test('correctly converts type with xjoin.primary.key: true', () => {
            fieldJSON.type['xjoin.primary.key'] = true;
            const field = plainToInstance(Field, fieldJSON);
            const primaryKey = field.getPrimaryKey();
            expect(primaryKey).toBe(true);
        });

        test('correctly converts type with xjoin.primary.key: false', () => {
            fieldJSON.type['xjoin.primary.key'] = false;
            const field = plainToInstance(Field, fieldJSON);
            const primaryKey = field.getPrimaryKey();
            expect(primaryKey).toBe(false);
        });

        test('correctly converts to avroType string', () => {
            const field = plainToInstance(Field, fieldJSON);
            const avroType = field.getAvroType();
            expect(avroType).toBe('string');
        });

        test('correctly converts to xjoin type', () => {
            const field = plainToInstance(Field, fieldJSON);
            const xjoinType = field.getXJoinType();
            expect(xjoinType).toBe('string');
        });
    })

    describe('Single Array Type', () => {
        const fieldArrayJSON = {
            "name": "id",
            "type": [{
                "type": "string",
                "xjoin.type": "string"
            }]
        };

        test('correctly converts to gql string type', () => {
            const field = plainToInstance(Field, fieldArrayJSON);
            const gqlType = field.getGraphQLType();
            expect(gqlType).toBe('String');
        });

        test('correctly converts to gql filter type', () => {
            const field = plainToInstance(Field, fieldArrayJSON);
            const filterType = field.getFilterType();
            expect(filterType).toBe('FilterString');
        });

        test('correctly converts type with no xjoin.enumeration key', () => {
            const field = plainToInstance(Field, fieldArrayJSON);
            const enumerationType = field.getEnumeration();
            expect(enumerationType).toBe(false);
        });

        test('correctly converts type with xjoin.enumeration: true', () => {
            fieldArrayJSON.type[0]['xjoin.enumeration'] = true;
            const field = plainToInstance(Field, fieldArrayJSON);
            const enumerationType = field.getEnumeration();
            expect(enumerationType).toBe(true);
        });

        test('correctly converts type with xjoin.enumeration: false', () => {
            fieldArrayJSON.type[0]['xjoin.enumeration'] = false;
            const field = plainToInstance(Field, fieldArrayJSON);
            const enumerationType = field.getEnumeration();
            expect(enumerationType).toBe(false);
        });

        test('correctly converts type with no xjoin.primary.key', () => {
            const field = plainToInstance(Field, fieldArrayJSON);
            const primaryKey = field.getPrimaryKey();
            expect(primaryKey).toBe(false);
        });

        test('correctly converts type with xjoin.primary.key: true', () => {
            fieldArrayJSON.type[0]['xjoin.primary.key'] = true;
            const field = plainToInstance(Field, fieldArrayJSON);
            const primaryKey = field.getPrimaryKey();
            expect(primaryKey).toBe(true);
        });

        test('correctly converts type with xjoin.primary.key: false', () => {
            fieldArrayJSON.type[0]['xjoin.primary.key'] = false;
            const field = plainToInstance(Field, fieldArrayJSON);
            const primaryKey = field.getPrimaryKey();
            expect(primaryKey).toBe(false);
        });

        test('correctly converts to avroType string', () => {
            const field = plainToInstance(Field, fieldArrayJSON);
            const avroType = field.getAvroType();
            expect(avroType).toBe('string');
        });

        test('correctly converts to xjoin type', () => {
            const field = plainToInstance(Field, fieldArrayJSON);
            const xjoinType = field.getXJoinType();
            expect(xjoinType).toBe('string');
        });
    });

    describe('Multiple Array Type', () => {
        const fieldMultipleArrayJSON = {
            "name": "id",
            "type": [{
                "type": "null"
            }, {
                "type": "string",
                "xjoin.type": "string"
            }]
        };

        test('correctly converts to gql string type', () => {
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const gqlType = field.getGraphQLType();
            expect(gqlType).toBe('String');
        });

        test('correctly converts to gql filter type', () => {
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const filterType = field.getFilterType();
            expect(filterType).toBe('FilterString');
        });

        test('correctly converts type with no xjoin.enumeration key', () => {
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const enumerationType = field.getEnumeration();
            expect(enumerationType).toBe(false);
        });

        test('correctly converts type with xjoin.enumeration: true', () => {
            fieldMultipleArrayJSON.type[1]['xjoin.enumeration'] = true;
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const enumerationType = field.getEnumeration();
            expect(enumerationType).toBe(true);
        });

        test('correctly converts type with xjoin.enumeration: false', () => {
            fieldMultipleArrayJSON.type[1]['xjoin.enumeration'] = false;
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const enumerationType = field.getEnumeration();
            expect(enumerationType).toBe(false);
        });

        test('correctly converts type with no xjoin.primary.key', () => {
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const primaryKey = field.getPrimaryKey();
            expect(primaryKey).toBe(false);
        });

        test('correctly converts type with xjoin.primary.key: true', () => {
            fieldMultipleArrayJSON.type[1]['xjoin.primary.key'] = true;
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const primaryKey = field.getPrimaryKey();
            expect(primaryKey).toBe(true);
        });

        test('correctly converts type with xjoin.primary.key: false', () => {
            fieldMultipleArrayJSON.type[1]['xjoin.primary.key'] = false;
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const primaryKey = field.getPrimaryKey();
            expect(primaryKey).toBe(false);
        });

        test('correctly converts to avroType string', () => {
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const avroType = field.getAvroType();
            expect(avroType).toBe('string');
        });

        test('correctly converts to xjoin type', () => {
            const field = plainToInstance(Field, fieldMultipleArrayJSON);
            const xjoinType = field.getXJoinType();
            expect(xjoinType).toBe('string');
        });

        test('throws an error when more than 2 types are specified', () => {
            fieldMultipleArrayJSON.type.push({
                type: 'boolean',
                'xjoin.type': 'boolean'
            });
            const field = plainToInstance(Field, fieldMultipleArrayJSON);

            expect(() => {
                field.getXJoinType();
            }).toThrow(
                `Invalid field: id. ` +
                'Fields are only allowed to have at most 2 types. When more than one type is used, ' +
                'the first must be null and the second must be a valid type object.');
        });

        test('throws an error when first type is not null', () => {
            const invalidField = {
                "name": "id",
                "type": [{
                    "type": "string",
                    "xjoin.type": "string"
                }, {
                    "type": "null"
                }]
            };

            const field = plainToInstance(Field, invalidField);

            expect(() => {
                field.getXJoinType();
            }).toThrow(
                `Invalid field: id. ` +
                'Fields are only allowed to have at most 2 types. When more than one type is used, ' +
                'the first must be null and the second must be a valid type object.');
        });
    });

    describe('Types', () => {
        test('correctly converts xjoin.type date_nanos', () => {
            const fieldJSON = {
                "name": "id",
                "type": {
                    "type": "string",
                    "xjoin.type": "date_nanos"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            const fieldTypes = field.typeConversion();
            expect(fieldTypes).toStrictEqual({
                graphqlType: 'String',
                filterType: 'FilterTimestamp',
                enumeration: false,
                primaryKey: false,
                avroType: 'string',
                xjoinType: 'date_nanos'
            });
        });

        test('correctly converts xjoin.type string', () => {
            const fieldJSON = {
                "name": "id",
                "type": {
                    "type": "string",
                    "xjoin.type": "string"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            const fieldTypes = field.typeConversion();
            expect(fieldTypes).toStrictEqual({
                graphqlType: 'String',
                filterType: 'FilterString',
                enumeration: false,
                primaryKey: false,
                avroType: 'string',
                xjoinType: 'string'
            });
        });

        test('correctly converts xjoin.type boolean', () => {
            const fieldJSON = {
                "name": "id",
                "type": {
                    "type": "boolean",
                    "xjoin.type": "boolean"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            const fieldTypes = field.typeConversion();
            expect(fieldTypes).toStrictEqual({
                graphqlType: 'Boolean',
                filterType: 'FilterBoolean',
                enumeration: false,
                primaryKey: false,
                avroType: 'boolean',
                xjoinType: 'boolean'
            });
        });

        test('correctly converts xjoin.type json with no children', () => {
            const fieldJSON = {
                "name": "id",
                "type": {
                    "type": "string",
                    "xjoin.type": "json"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            const fieldTypes = field.typeConversion();
            expect(fieldTypes).toStrictEqual({
                graphqlType: 'Object',
                filterType: '',
                enumeration: false,
                primaryKey: false,
                avroType: 'string',
                xjoinType: 'json'
            });
        });

        test('correctly converts xjoin.type json with children', () => {
            const fieldJSON = {
                "name": "system_profile",
                "type": {
                    "type": "string",
                    "xjoin.type": "json",
                    "xjoin.fields": [{
                        "name": "arch",
                        "type": {
                            "xjoin.type": "string"
                        }
                    }]
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            const fieldTypes = field.typeConversion();
            expect(fieldTypes).toStrictEqual({
                graphqlType: 'Object',
                filterType: 'SystemProfileFilter',
                enumeration: false,
                primaryKey: false,
                avroType: 'string',
                xjoinType: 'json'
            });
        });

        test('correctly converts xjoin.type reference', () => {
            const fieldJSON = {
                "name": "host",
                "type": {
                    "type": "record",
                    "xjoin.type": "reference"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            const fieldTypes = field.typeConversion();
            expect(fieldTypes).toStrictEqual({
                graphqlType: 'Reference',
                filterType: 'FilterString',
                enumeration: false,
                primaryKey: false,
                avroType: 'record',
                xjoinType: 'reference'
            });
        });

        test('correctly converts xjoin.type string array', () => {
            const fieldJSON = {
                "name": "tags_structured",
                "type": {
                    "type": "array",
                    "items": "string",
                    "xjoin.type": "array"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            const fieldTypes = field.typeConversion();
            expect(fieldTypes).toStrictEqual({
                graphqlType: GRAPHQL_TYPES.StringArray,
                filterType: GRAPHQL_FILTER_TYPES.FILTER_STRING_ARRAY,
                enumeration: false,
                primaryKey: false,
                avroType: 'array',
                xjoinType: 'array'
            });
        });

        test('throws an error when an invalid xjoin.type is encountered', () => {
            const fieldJSON = {
                "name": "tags_structured",
                "type": {
                    "type": "string",
                    "xjoin.type": "asdf"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            expect(() => {
                field.typeConversion();
            }).toThrow(
                `encountered invalid xjoin.type: asdf on field: tags_structured`);
        });
    });

    describe('field.validate()', () => {
        test('throws an error when field is missing name', () => {
            const fieldJSON = {
                "type": {
                    "type": "string",
                    "xjoin.type": "string"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            expect(() => {
                field.validate();
            }).toThrow(
                `field is missing name attribute`);
        });

        test('throws an error when field is missing xjoin.type', () => {
            const fieldJSON = {
                "name": "tags_structured",
                "type": {
                    "type": "string"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            expect(() => {
                field.validate();
            }).toThrow(
                `field tags_structured is missing xjoin.type attribute`);
        });

        test('throws an error when field is missing type', () => {
            const fieldJSON = {
                "name": "tags_structured",
                "type": {
                    "xjoin.type": "string"
                }
            }

            const field = plainToInstance(Field, fieldJSON);
            expect(() => {
                field.validate();
            }).toThrow(
                `field tags_structured is missing type attribute`);
        });
    })

    describe('field.getChildren()', () => {
        test('returns children when type is an array with length 1', () => {
            const fieldJSON = {
                "name": "host",
                "type": [{
                    "type": "record",
                    "xjoin.type": "reference",
                    "fields": [{
                        "name": "account",
                        "type": {
                            "type": "string",
                            "xjoin.type": "string"
                        }
                    }]
                }]
            }
            const field = plainToInstance(Field, fieldJSON);
            const children = field.getChildren();
            expect(children).toHaveLength(1);
            expect(children).toEqual([{
                "default": "",
                "name": "account",
                "type": {
                    "type": "string",
                    "xjoinType": "string",
                    "name": "",
                    "items": "",
                    "fields":[]
                }
            }]);
        })
    });

    test('returns children when type is an array with length 1 with xjoin.fields', () => {
        const fieldJSON = {
            "name": "host",
            "type": [{
                "type": "string",
                "xjoin.type": "json",
                "xjoin.fields": [{
                    "name": "account",
                    "type": {
                        "type": "string",
                        "xjoin.type": "string"
                    }
                }]
            }]
        }
        const field = plainToInstance(Field, fieldJSON);
        const children = field.getChildren();
        expect(children).toHaveLength(1);
        expect(children).toEqual([{
            "default": "",
            "name": "account",
            "type": {
                "type": "string",
                "xjoinType": "string",
                "name": "",
                "items": "",
                "fields":[]
            }
        }]);
    })
});
