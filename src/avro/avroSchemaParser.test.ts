import 'reflect-metadata';
import {AvroSchemaParser} from "./avroSchemaParser.js";
import {readFileSync} from 'fs';
import {dirname} from 'path';
import {fileURLToPath} from 'url';
import {gql} from 'apollo-server-express';

function loadGraphqlSchemaFromFile(name: string): string {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return readFileSync(`${__dirname}/../test/graphqlSchemas/${name}.graphql`).toString();
}

function loadAvroSchemaFromFile(name: string): string {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return readFileSync(`${__dirname}/../test/avroSchemas/${name}.json`).toString();
}

function enumerationTest(fileName: string) {
    const avroSchema = JSON.parse(loadAvroSchemaFromFile(fileName));
    const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
    const graphqlSchema = gql(avroSchemaParser.convertToGraphQL().toString());
    const expectedGraphqlSchema = gql(loadGraphqlSchemaFromFile(fileName))
    expect(graphqlSchema.definitions).toEqual(expectedGraphqlSchema.definitions);
}

describe('AvroSchemaParser', () => {
    describe('constructor', () => {
        test('throws an error when missing parameter avroSchema', () => {
            expect(() => {
                new AvroSchemaParser('');
            })
                .toThrow('avroSchema is a required parameter to create an AvroSchemaParser');
        })

        test("throws an error when avroSchema's type is not record", () => {
            const avroSchema = {
                type: 'string'
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema));
            })
                .toThrow('avroSchema type must be "record"');
        })

        test("throws an error when avroSchema is missing a name", () => {
            const avroSchema = {
                type: 'record'
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema));
            })
                .toThrow('avroSchema must have a name');
        })

        test('throws an error when avroSchema is missing a root field', () => {
            const avroSchema = {
                type: 'record',
                name: 'test schema'
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema));
            })
                .toThrow('avroSchema must contain a single root field');
        })

        test("throws an error when avroSchema's root field is missing a name", () => {
            const avroSchema = {
                type: 'record',
                name: 'test schema',
                fields: [{}]
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema));
            })
                .toThrow('avroSchema root field must have a name');
        })

        test("throws an error when avroSchema's root field is not type=record", () => {
            const avroSchema = {
                type: 'record',
                name: 'test schema',
                fields: [{
                    name: 'root',
                    type: 'string',
                    'xjoin.type': 'reference'
                }]
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema));
            })
                .toThrow('avroSchema root field must be type=record');

            const avroSchema2 = {
                type: 'record',
                name: 'test schema',
                fields: [{
                    name: 'root',
                    type: {
                        type: 'string',
                        'xjoin.type': 'reference',
                        name: 'value'
                    }
                }]
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema2));
            })
                .toThrow('avroSchema root field must be type=record');
        })

        test("throws an error when avroSchema's root field is not xjoin.type=reference", () => {
            const avroSchema = {
                type: 'record',
                name: 'test schema',
                fields: [{
                    name: 'root',
                    type: 'record',
                    'xjoin.type': 'string'
                }]
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema));
            })
                .toThrow('avroSchema root field must be xjoin.type=reference');

            const avroSchema2 = {
                type: 'record',
                name: 'test schema',
                fields: [{
                    name: 'root',
                    type: {
                        type: 'record',
                        'xjoin.type': 'string',
                        name: 'value'
                    }
                }]
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema2));
            })
                .toThrow('avroSchema root field must be xjoin.type=reference');
        })

        test("throws an error when avroSchema's root field contains no children", () => {
            const avroSchema = {
                type: 'record',
                name: 'test schema',
                fields: [{
                    name: 'root',
                    type: {
                        'xjoin.type': 'reference',
                        type: 'record'
                    }
                }]
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema));
            })
                .toThrow('avroSchema root field must contain at least one child field');

            const avroSchema2 = {
                type: 'record',
                name: 'test schema',
                fields: [{
                    name: 'root',
                    type: {
                        'xjoin.type': 'reference',
                        type: 'record',
                        fields: []
                    }
                }]
            };

            expect(() => {
                new AvroSchemaParser(JSON.stringify(avroSchema2));
            })
                .toThrow('avroSchema root field must contain at least one child field');
        });
    });

    describe('convertToGraphQL', () => {
        test('converts the minimum valid avro schema to a graphql schema', async () => {
            const avroSchemaParser = new AvroSchemaParser(loadAvroSchemaFromFile('minimum.valid'));
            const graphqlSchema = gql(avroSchemaParser.convertToGraphQL().toString());
            const expectedGraphqlSchema = gql(loadGraphqlSchemaFromFile('minimum.valid'));
            expect(graphqlSchema.definitions).toEqual(expectedGraphqlSchema.definitions);
        });

        test('throws an error if no primary key is defined on the root field', async () => {
            const avroSchema = JSON.parse(loadAvroSchemaFromFile('minimum.valid'));
            delete avroSchema.fields[0].type.fields[0].type['xjoin.primary.key'];
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('missing xjoin.primary.key child field on reference field host');
        });

        test('throws an error if multiple primary keys are defined on the root field', async () => {
            const avroSchema = JSON.parse(loadAvroSchemaFromFile('minimum.valid'));
            avroSchema.fields[0].type.fields.push({
                name: 'another',
                type: {
                    type: 'string',
                    'xjoin.type': 'string',
                    'xjoin.primary.key': true
                }
            })
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('multiple primary keys defined on host');
        });

        test('throws an error if a child field is missing a name', async () => {
            const avroSchema = JSON.parse(loadAvroSchemaFromFile('minimum.valid'));
            delete avroSchema.fields[0].type.fields[0].name
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('field is missing name attribute');
        });

        test('throws an error if a child field is missing an avro type', async () => {
            const avroSchema = JSON.parse(loadAvroSchemaFromFile('minimum.valid'));
            delete avroSchema.fields[0].type.fields[0].type.type
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('field id is missing type attribute');
        });

        test('throws an error if a child field is missing an xjoin.type', async () => {
            const avroSchema = JSON.parse(loadAvroSchemaFromFile('minimum.valid'));
            delete avroSchema.fields[0].type.fields[0].type['xjoin.type'];
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('field id is missing xjoin.type attribute');
        });

        test("correctly converts json object type with no children", async () => {
            const avroSchema = JSON.parse(loadAvroSchemaFromFile('minimum.valid'));
            avroSchema.fields[0].type.fields.push({
                name: 'parent',
                type: {
                    type: 'string',
                    'xjoin.type': 'json'
                }
            });
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            const graphqlSchema = gql(avroSchemaParser.convertToGraphQL().toString());
            const expectedGraphqlSchema = gql(loadGraphqlSchemaFromFile('single.json.child'))
            expect(graphqlSchema.definitions).toEqual(expectedGraphqlSchema.definitions);
        });

        test("doesn't include fields with xjoin.index: false in graphql schema", async () => {
            const avroSchema = JSON.parse(loadAvroSchemaFromFile('minimum.valid'));
            avroSchema.fields[0].type.fields.push({
                name: 'another',
                'xjoin.index': false,
                type: {
                    type: 'string',
                    'xjoin.type': 'string'
                }
            })
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            const graphqlSchema = gql(avroSchemaParser.convertToGraphQL().toString());
            const expectedGraphqlSchema = gql(loadGraphqlSchemaFromFile('minimum.valid'))

            expect(graphqlSchema.definitions).toEqual(expectedGraphqlSchema.definitions);
        });

        test("doesn't include nested fields with xjoin.index: false in graphql schema", async () => {
            const avroSchema = JSON.parse(loadAvroSchemaFromFile('minimum.valid'));
            avroSchema.fields[0].type.fields.push({
                name: 'parent',
                type: {
                    type: 'string',
                    'xjoin.type': 'json',
                    'xjoin.fields': [{
                        name: 'child1',
                        'xjoin.index': true,
                        type: {
                            type: 'string',
                           'xjoin.type': 'string'
                        }
                    }, {
                        name: 'child2',
                        'xjoin.index': false,
                        type: {
                            type: 'string',
                            'xjoin.type': 'string'
                        }
                    }]
                }
            });
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            const graphqlSchema = gql(avroSchemaParser.convertToGraphQL().toString());
            const expectedGraphqlSchema = gql(loadGraphqlSchemaFromFile('nested.single.child'))
            expect(graphqlSchema.definitions).toEqual(expectedGraphqlSchema.definitions);
        });
    });

    describe('convertToGraphQL enumerations', () => {
        test('correctly adds enumeration elements when a single field has enumeration: true', async () => {
            enumerationTest('single.enumeration');
        });

        test('correctly adds enumeration elements when a multiple fields have enumeration: true', async () => {
            enumerationTest('multiple.enumerations');
        });

        test('correctly adds enumeration elements when a nested field has enumeration: true', async () => {
            enumerationTest('nested.enumeration');
        });

        test('correctly adds enumeration elements when both a root and a nested field have enumeration: true', async () => {
            enumerationTest('nested.and.root.enumeration');
        });

        test('correctly adds enumeration elements when a deeply nested field has enumeration: true', async () => {
            enumerationTest('deeply.nested.enumeration');
        });

        test('correctly adds enumeration elements when a boolean field has enumeration: true', async () => {
            enumerationTest('boolean.enumeration');
        });
    });
});