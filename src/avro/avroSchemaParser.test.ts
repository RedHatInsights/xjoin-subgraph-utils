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
            const avroSchema = {
                type: 'record',
                name: 'Value',
                namespace: 'hosts',
                fields: [{
                    name: 'host',
                    type: {
                        type: 'record',
                        'xjoin.type': 'reference',
                        fields: [{
                            name: 'id',
                            type: {
                                type: 'string',
                                'xjoin.type': 'string',
                                'xjoin.primary.key': true
                            }
                        }]
                    }
                }]
            };
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            const graphqlSchema = gql(avroSchemaParser.convertToGraphQL().toString());
            const expectedGraphqlSchema = gql(loadGraphqlSchemaFromFile('minimum.valid'))

            expect(graphqlSchema.definitions).toEqual(expectedGraphqlSchema.definitions);
        });

        test('throws an error if no primary key is defined on the root field', async () => {
            const avroSchema = {
                type: 'record',
                name: 'Value',
                namespace: 'hosts',
                fields: [{
                    name: 'host',
                    type: {
                        type: 'record',
                        'xjoin.type': 'reference',
                        fields: [{
                            name: 'id',
                            type: {
                                type: 'string',
                                'xjoin.type': 'string'
                            }
                        }]
                    }
                }]
            };
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('missing xjoin.primary.key child field on reference field host');
        });

        test('throws an error if multiple primary keys are defined on the root field', async () => {
            const avroSchema = {
                type: 'record',
                name: 'Value',
                namespace: 'hosts',
                fields: [{
                    name: 'host',
                    type: {
                        type: 'record',
                        'xjoin.type': 'reference',
                        fields: [{
                            name: 'id',
                            type: {
                                type: 'string',
                                'xjoin.type': 'string',
                                'xjoin.primary.key': true
                            }
                        }, {
                            name: 'another',
                            type: {
                                type: 'string',
                                'xjoin.type': 'string',
                                'xjoin.primary.key': true
                            }
                        }]
                    }
                }]
            };
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('multiple primary keys defined on host');
        });

        test('throws an error if a child field is missing a name', async () => {
            const avroSchema = {
                type: 'record',
                name: 'Value',
                namespace: 'hosts',
                fields: [{
                    name: 'host',
                    type: {
                        type: 'record',
                        'xjoin.type': 'reference',
                        fields: [{
                            type: {
                                type: 'string',
                                'xjoin.type': 'string',
                                'xjoin.primary.key': true
                            }
                        }]
                    }
                }]
            };
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('field is missing name attribute');
        });

        test('throws an error if a child field is missing an avro type', async () => {
            const avroSchema = {
                type: 'record',
                name: 'Value',
                namespace: 'hosts',
                fields: [{
                    name: 'host',
                    type: {
                        type: 'record',
                        'xjoin.type': 'reference',
                        fields: [{
                            name: 'id',
                            type: {
                                'xjoin.type': 'string',
                                'xjoin.primary.key': true
                            }
                        }]
                    }
                }]
            };
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('field id is missing type attribute');
        });

        test('throws an error if a child field is missing an xjoin.type', async () => {
            const avroSchema = {
                type: 'record',
                name: 'Value',
                namespace: 'hosts',
                fields: [{
                    name: 'host',
                    type: {
                        type: 'record',
                        'xjoin.type': 'reference',
                        fields: [{
                            name: 'id',
                            type: {
                                type: 'string',
                                'xjoin.primary.key': true
                            }
                        }]
                    }
                }]
            };
            const avroSchemaParser = new AvroSchemaParser(JSON.stringify(avroSchema));
            expect(() => {avroSchemaParser.convertToGraphQL()}).toThrow('field id is missing xjoin.type attribute');
        });

        test('doesnt index fields with xjoin.index: false', async () => {

        });

        test('doesnt index nested fields with xjoin.index: false', async () => {

        });
    });

    describe('convertToGraphQL enumerations', () => {

    });
});