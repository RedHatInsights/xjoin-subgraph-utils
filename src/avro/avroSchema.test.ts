import 'reflect-metadata';
import {plainToInstance} from "class-transformer";
import {Field} from "./avroSchema.js";
import {AvroSchemaParser} from "./avroSchemaParser";

describe('Field', () => {
    describe('Object Type String', () => {
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

    describe('Single Array Type String', () => {
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

    describe('Multiple Array Type String', () => {
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
});
