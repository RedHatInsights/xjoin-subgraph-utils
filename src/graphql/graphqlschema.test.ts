import 'reflect-metadata';
import {
    GraphQLEnum,
    GraphQLField,
    GraphQLInput,
    GraphQLInputField, GraphQLObjectType, GraphQLQuery,
    GraphQLQueryParameter, GraphqlSchema,
    GraphQLType
} from "./graphqlschema.js";
import {format} from 'prettier';
import {loadGraphqlSchemaFromFile} from "../test/utils.js";

describe('GraphQLEnum', () => {
    test('constructor sets name', () => {
        const gqlEnum = new GraphQLEnum('testEnum');
        expect(gqlEnum.name).toBe('testEnum');
        expect(gqlEnum.values).toEqual([]);
    });

    test('addValue appends to values', () => {
        const gqlEnum = new GraphQLEnum('testEnum');
        gqlEnum.addValue('enumValue');
        expect(gqlEnum.name).toBe('testEnum');
        expect(gqlEnum.values).toEqual(['enumValue']);
    });
});

describe('GraphQLInputField', () => {
    test('constructor sets name and type', () => {
        const gqlInputField = new GraphQLInputField('inputName', 'inputType');
        expect(gqlInputField.name).toBe('inputName');
        expect(gqlInputField.type).toBe('inputType');
    });
});

describe('GraphQLInput', () => {
    test('constructor sets name', () => {
        const gqlInput = new GraphQLInput('inputName');
        expect(gqlInput.name).toBe('inputName');
        expect(gqlInput.fields).toEqual([]);
    });

    test('addField appends a field', () => {
        const gqlInput = new GraphQLInput('inputName');
        const gqlInputField = new GraphQLInputField('fieldName', 'string');
        gqlInput.addField(gqlInputField);
        expect(gqlInput.fields).toEqual([{name: 'fieldName', type: 'string'}])
    });

    test('getField returns a field given a name', () => {
        const gqlInput = new GraphQLInput('inputName');
        gqlInput.addField(new GraphQLInputField('fieldName', 'string'));
        gqlInput.addField(new GraphQLInputField('anotherFieldName', 'boolean'));
        const retrievedField = gqlInput.getField('anotherFieldName');
        expect(retrievedField).toEqual({name: 'anotherFieldName', type: 'boolean'})
    });

    test('getField throws an exception when field is not found', () => {
        const gqlInput = new GraphQLInput('inputName');
        gqlInput.addField(new GraphQLInputField('fieldName', 'string'));
        gqlInput.addField(new GraphQLInputField('anotherFieldName', 'boolean'));
        expect(() => {
            gqlInput.getField('foo');
        }).toThrow('unable to find field: foo on GraphQLInput inputName');
    });
});

describe('GraphQLField', () => {
    test('constructor sets name and type', () => {
        const gqlField = new GraphQLField('fieldName', new GraphQLType('FieldType'));
        expect(gqlField.name).toBe('fieldName');
        expect(gqlField.type).toEqual({name: 'FieldType', isArray: false, isRequired: false});
        expect(gqlField.parameters).toEqual([]);
    });

    test('addParameter appends a parameter', () => {
        const gqlField = new GraphQLField('fieldName', new GraphQLType('FieldType'));
        gqlField.addParameter(new GraphQLQueryParameter('queryParamName', 'string'))
        expect(gqlField.parameters).toEqual([{name: 'queryParamName', type: 'string', defaultValue: ''}])
    });
});

describe('GraphQLType', () => {
    test('constructor sets name and defaults other parameters', () => {
        const gqlType = new GraphQLType('TestType');
        expect(gqlType.name).toBe('TestType');
        expect(gqlType.isArray).toBe(false);
        expect(gqlType.isRequired).toBe(false);
    });

    test('constructor sets name, isArray, and isRequired', () => {
        const gqlType = new GraphQLType('TestType', true, true);
        expect(gqlType.name).toBe('TestType');
        expect(gqlType.isArray).toBe(true);
        expect(gqlType.isRequired).toBe(true);
    });

    test('toString converts not array, not required type to string', () => {
        const gqlType = new GraphQLType('TestType', false, false);
        expect(gqlType.toString()).toEqual('TestType');
    });

    test('toString converts not required array type to string', () => {
        const gqlType = new GraphQLType('TestType', true, false);
        expect(gqlType.toString()).toEqual('[TestType]');
    });

    test('toString converts required array type to string', () => {
        const gqlType = new GraphQLType('TestType', true, true);
        expect(gqlType.toString()).toEqual('[TestType]!');
    });

    test('toString converts required plain type to string', () => {
        const gqlType = new GraphQLType('TestType', false, true);
        expect(gqlType.toString()).toEqual('TestType!');
    });

    test('isScalar return true if type name is a scalar', () => {
        const gqlStringType = new GraphQLType('String', false, false);
        expect(gqlStringType.isScalar()).toBe(true);

        const gqlIntType = new GraphQLType('Int', false, false);
        expect(gqlIntType.isScalar()).toBe(true);

        const gqlBooleanType = new GraphQLType('Boolean', false, false);
        expect(gqlBooleanType.isScalar()).toBe(true);

        const gqlFloatType = new GraphQLType('Float', false, false);
        expect(gqlFloatType.isScalar()).toBe(true);

        const gqlIdType = new GraphQLType('Id', false, false);
        expect(gqlIdType.isScalar()).toBe(true);
    });

    test('isScalar return false if type name is not a scalar', () => {
        const gqlType = new GraphQLType('AType', false, false);
        expect(gqlType.isScalar()).toBe(false);
    });

    test('isEnumerationScalar return true if type name is an enumeration scalar', () => {
        const gqlStringType = new GraphQLType('StringEnumeration', false, false);
        expect(gqlStringType.isEnumerationScalar()).toBe(true);

        const gqlIntType = new GraphQLType('IntEnumeration', false, false);
        expect(gqlIntType.isEnumerationScalar()).toBe(true);

        const gqlBooleanType = new GraphQLType('BooleanEnumeration', false, false);
        expect(gqlBooleanType.isEnumerationScalar()).toBe(true);

        const gqlFloatType = new GraphQLType('FloatEnumeration', false, false);
        expect(gqlFloatType.isEnumerationScalar()).toBe(true);

        const gqlIdType = new GraphQLType('IdEnumeration', false, false);
        expect(gqlIdType.isEnumerationScalar()).toBe(true);
    });

    test('isEnumerationScalar return false if type name is not an enumeration scalar', () => {
        const gqlType = new GraphQLType('foo', false, false);
        expect(gqlType.isEnumerationScalar()).toBe(false);
    });
});

describe('GraphQLObjectType', () => {
    test('constructor sets name', () => {
        const gqlObjectType = new GraphQLObjectType('ObjectName');
        expect(gqlObjectType.name).toBe('ObjectName');
        expect(gqlObjectType.keys).toEqual([]);
        expect(gqlObjectType.fields).toEqual([]);
    });

    test('addField appends a field', () => {
        const gqlObjectType = new GraphQLObjectType('ObjectName');
        gqlObjectType.addField(new GraphQLField('FieldName', new GraphQLType('String')))
        expect(gqlObjectType.fields).toEqual([{
            name: 'FieldName',
            type: {name: 'String', isRequired: false, isArray: false},
            parameters: []
        }])
    });

    test('getFieldType returns the type of field given a name', () => {
        const gqlObjectType = new GraphQLObjectType('ObjectName');
        gqlObjectType.addField(new GraphQLField('FieldName', new GraphQLType('String')))
        gqlObjectType.addField(new GraphQLField('Foo', new GraphQLType('Boolean')))
        const fieldType = gqlObjectType.getFieldType('Foo');
        expect(fieldType).toEqual({
            isArray: false,
            isRequired: false,
            name: 'Boolean'
        });
    });

    test('getFieldType throws an exception when field is not found', () => {
        const gqlObjectType = new GraphQLObjectType('ObjectName');
        gqlObjectType.addField(new GraphQLField('FieldName', new GraphQLType('String')))
        gqlObjectType.addField(new GraphQLField('Foo', new GraphQLType('Boolean')))

        expect(() => {
            gqlObjectType.getFieldType('bar');
        }).toThrow('field bar not found on GraphQLObjectType ObjectName');
    });

    test('addKey appends a key', () => {
        const gqlObjectType = new GraphQLObjectType('ObjectName');
        gqlObjectType.addKey('testKey');
        expect(gqlObjectType.keys).toEqual(['testKey']);
    });
});

describe('GraphQLQueryParameter', () => {
    test('constructor sets name, type, defaultValue', () => {
        const gqlQueryParameter = new GraphQLQueryParameter('ParameterName', 'String');
        expect(gqlQueryParameter).toEqual({name: 'ParameterName', type: 'String', defaultValue: ''});

        const gqlQueryParameter2 = new GraphQLQueryParameter('ParameterName', 'String', 'foo');
        expect(gqlQueryParameter2).toEqual({name: 'ParameterName', type: 'String', defaultValue: 'foo'});
    });
});

describe('GraphQLQuery', () => {
    test('constructor sets name', () => {
        const gqlQuery = new GraphQLQuery('TestQuery');
        expect(gqlQuery.name).toBe('TestQuery');
        expect(gqlQuery.parameters).toEqual([]);
        expect(gqlQuery.response).toEqual({
            name: '',
            isArray: false,
            isRequired: false
        })
    });

    test('addParameter appends a parameter', () => {
        const gqlQuery = new GraphQLQuery('TestQuery');
        gqlQuery.addParameter(new GraphQLQueryParameter('TestParameter', 'String'));
        expect(gqlQuery.parameters).toEqual([{name: 'TestParameter', type: 'String', defaultValue: ''}])
    });
});

describe('GraphQLSchema', () => {
    test('constructor sets string parameters', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        expect(gqlSchema.rootOrderByScalarName).toEqual('TestSchemasOrderBy');
        expect(gqlSchema.rootQueryName).toEqual('TestSchemas');
        expect(gqlSchema.enumerationsRoot).toEqual('TestSchemaEnumeration');
        expect(gqlSchema.rootFilter).toEqual('TestSchemaFilter');
        expect(gqlSchema.avroRootName).toEqual('TestSchema');
    });

    test('constructor adds default enums', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        expect(gqlSchema.enums).toEqual([
            {
                name: "ORDER_DIR",
                values: ["ASC", "DESC"]
            },
            {
                name: "ENUMERATION_ORDER_BY",
                values: ["value", "count"]
            }
        ]);
    });

    test('constructor adds default types', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        expect(gqlSchema.types).toEqual([
            {
                fields: [
                    {
                        name: "count",
                        parameters: [],
                        type: {
                            isArray: false,
                            isRequired: false,
                            name: "Int"
                        }
                    },
                    {
                        name: "total",
                        parameters: [],
                        type: {
                            isArray: false,
                            isRequired: false,
                            name: "Int"
                        }
                    }
                ],
                keys: [],
                name: "CollectionMeta"
            },
            {
                fields: [
                    {
                        name: "value",
                        parameters: [],
                        type: {
                            isArray: false,
                            isRequired: true,
                            name: "String"
                        }
                    },
                    {
                        name: "count",
                        parameters: [],
                        type: {
                            isArray: false,
                            isRequired: true,
                            name: "Int"
                        }
                    }
                ],
                keys: [],
                name: "StringEnumerationValue"
            },
            {
                fields: [
                    {
                        name: "data",
                        parameters: [],
                        type: {
                            isArray: true,
                            isRequired: true,
                            name: "StringEnumerationValue"
                        }
                    },
                    {
                        name: "meta",
                        parameters: [],
                        type: {
                            isArray: false,
                            isRequired: true,
                            name: "CollectionMeta"
                        }
                    }
                ],
                keys: [],
                name: "StringEnumeration"
            },
            {
                fields: [
                    {
                        name: "value",
                        parameters: [],
                        type: {
                            isArray: false,
                            isRequired: true,
                            name: "Boolean"
                        }
                    },
                    {
                        name: "count",
                        parameters: [],
                        type: {
                            isArray: false,
                            isRequired: true,
                            name: "Int"
                        }
                    }
                ],
                keys: [],
                name: "BooleanEnumerationValue"
            },
            {
                fields: [
                    {
                        name: "data",
                        parameters: [],
                        type: {
                            isArray: true,
                            isRequired: true,
                            name: "BooleanEnumerationValue"
                        }
                    },
                    {
                        name: "meta",
                        parameters: [],
                        type: {
                            isArray: false,
                            isRequired: true,
                            name: "CollectionMeta"
                        }
                    }
                ],
                keys: [],
                name: "BooleanEnumeration"
            }
        ]);
    });

    test('constructor adds default scalars', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        expect(gqlSchema.scalars).toEqual(['JSONObject']);
    });

    test('constructor adds default filters', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        expect(gqlSchema.inputs).toEqual([
            {
                fields: [
                    {
                        name: "lt",
                        type: "String"
                    },
                    {
                        name: "lte",
                        type: "String"
                    },
                    {
                        name: "gt",
                        type: "String"
                    },
                    {
                        name: "gte",
                        type: "String"
                    },
                    {
                        name: "eq",
                        type: "String"
                    }
                ],
                name: "FilterTimestamp"
            },
            {
                fields: [
                    {
                        name: "lt",
                        type: "Int"
                    },
                    {
                        name: "lte",
                        type: "Int"
                    },
                    {
                        name: "gt",
                        type: "Int"
                    },
                    {
                        name: "gte",
                        type: "Int"
                    }
                ],
                name: "FilterInt"
            },
            {
                fields: [
                    {
                        name: "eq",
                        type: "String"
                    }
                ],
                name: "FilterString"
            },
            {
                fields: [
                    {
                        name: "contains_all",
                        type: "[String]"
                    },
                    {
                        name: "contains_any",
                        type: "[String]"
                    }
                ],
                name: "FilterStringArray"
            },
            {
                fields: [
                    {
                        name: "is",
                        type: "Boolean"
                    }
                ],
                name: "FilterBoolean"
            },
            {
                fields: [
                    {
                        name: "search",
                        type: "FilterString"
                    }
                ],
                name: "EnumerationFilter"
            }
        ]);
    });

    test('addQuery appends a query', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addQuery(new GraphQLQuery('TestQuery'));
        expect(gqlSchema.queries).toEqual([
            {
                name: 'TestQuery',
                parameters: [],
                response: {
                    isArray: false,
                    isRequired: false,
                    name: ''
                }
            }
        ]);
    });

    test('addType appends a type', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addType(new GraphQLObjectType('TestType'));
        expect(gqlSchema.types).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'TestType',
                    fields: [],
                    keys: []
                })
            ])
        )
    });

    test('addScalar appends a scalar', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addScalar('TestScalar');
        expect(gqlSchema.scalars).toContain('TestScalar');
    });

    test('addEnum appends an enum', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addEnum(new GraphQLEnum('TestEnum'));
        expect(gqlSchema.enums).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'TestEnum',
                    values: []
                })
            ])
        )
    });

    test('addRootOrderByField appends a rootOrderByField', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addRootOrderByField('TestRootOrderByField');
        expect(gqlSchema.rootOrderByFields).toContain('TestRootOrderByField');
    });

    test('addInput appends an input', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addInput(new GraphQLInput('TestInput'));
        expect(gqlSchema.inputs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'TestInput',
                    fields: []
                })
            ])
        )
    });

    test('getInput finds in input by name', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addInput(new GraphQLInput('TestInput'));
        gqlSchema.addInput(new GraphQLInput('Foo'));
        const input = gqlSchema.getInput('Foo');
        expect(input).toEqual({
            name: 'Foo',
            fields: []
        });
    });

    test('getInput throws an exception when input is not found', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addInput(new GraphQLInput('TestInput'));
        gqlSchema.addInput(new GraphQLInput('Foo'));
        expect(() => {
            gqlSchema.getInput('Bar');
        }).toThrow('Input not found: Bar on GraphQL Schema: TestSchema');
    });

    test('getObjectType finds in input by name', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addType(new GraphQLObjectType('TestType'));
        gqlSchema.addType(new GraphQLObjectType('Foo'));
        const type = gqlSchema.getObjectType('Foo');
        expect(type).toEqual({
            name: 'Foo',
            fields: [],
            keys: []
        });
    });

    test('getObjectType throws an exception when input is not found', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addType(new GraphQLObjectType('TestInput'));
        gqlSchema.addType(new GraphQLObjectType('Foo'));
        expect(() => {
            gqlSchema.getObjectType('Bar');
        }).toThrow('Object Type not found: Bar on GraphQL Schema: TestSchema');
    });

    test('getTypeFromParent returns the child type from a parent type given the names of each', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        const testType = new GraphQLObjectType('TestInput');
        testType.addField(new GraphQLField('TestField', new GraphQLType('TestType', true, true)));
        testType.addField(new GraphQLField('AnotherChild', new GraphQLType('AnotherType')));
        gqlSchema.addType(testType);
        gqlSchema.addType(new GraphQLObjectType('Foo'));

        const childType = gqlSchema.getTypeFromParent('TestInput', 'TestField');
        expect(childType).toEqual({
            isArray: true,
            isRequired: true,
            name: "TestType"
        });
    });

    test('getTypeFromParent throws an exception when parent is not found', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        const testType = new GraphQLObjectType('TestInput');
        testType.addField(new GraphQLField('TestField', new GraphQLType('TestType', true, true)));
        gqlSchema.addType(testType);

        expect(() => {
            gqlSchema.getTypeFromParent('Foo', 'TestField');
        }).toThrow('Parent Type not found: Foo on GraphQL Schema: TestSchema');
    });

    test('getTypeFromParent throws an exception when child is not found', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        const testType = new GraphQLObjectType('TestInput');
        testType.addField(new GraphQLField('TestField', new GraphQLType('TestType', true, true)));
        gqlSchema.addType(testType);

        expect(() => {
            gqlSchema.getTypeFromParent('TestInput', 'Foo');
        }).toThrow('Child Type: Foo not found on parent: TestInput on GraphQL Schema: TestSchema');
    });

    test('getQuery returns a query given a name', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addQuery(new GraphQLQuery('TestQuery', new GraphQLType('string')));
        gqlSchema.addQuery(new GraphQLQuery('Foo', new GraphQLType('boolean')));
        const query = gqlSchema.getQuery('Foo');
        expect(query).toEqual({
            name: 'Foo',
            parameters: [],
            response: {
                isArray: false,
                isRequired: false,
                name: 'boolean'
            }
        });
    });

    test('getQuery throws an exception when queryName is not found', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addQuery(new GraphQLQuery('TestQuery', new GraphQLType('string')));
        gqlSchema.addQuery(new GraphQLQuery('Foo', new GraphQLType('boolean')));
        expect(() => {
            gqlSchema.getQuery('Bar')
        }).toThrow('query Bar not found on GraphQLSchema TestSchema');
    });
});

describe('GraphQLSchema.toString()', () => {
    test('converts a basic schema to a string', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        const gqlQuery = new GraphQLQuery('TestQuery', new GraphQLType('string'));
        gqlSchema.addQuery(gqlQuery);

        const schemaString = format(gqlSchema.toString(), {parser: 'graphql'})
        const expectedSchemaString = format(loadGraphqlSchemaFromFile('minimum.valid.test'), {parser: 'graphql'});
        expect(schemaString).toEqual(expectedSchemaString);
    });

    test('converts a complex schema to a string', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        const testQuery = new GraphQLQuery('TestQuery', new GraphQLType('string', false, true));
        gqlSchema.addQuery(testQuery);

        const fooQuery = new GraphQLQuery('FooQuery', new GraphQLType('Foo', true, true));
        fooQuery.addParameter(new GraphQLQueryParameter('TestParameter', 'boolean', 'false'));
        fooQuery.addParameter(new GraphQLQueryParameter('FooParameter', 'string', 'bar'));
        fooQuery.addParameter(new GraphQLQueryParameter('Foo2Parameter', 'Foo'));
        gqlSchema.addQuery(fooQuery);

        const fooType = new GraphQLObjectType('Foo');
        fooType.addField(new GraphQLField('id', new GraphQLType('string')));
        fooType.addField(new GraphQLField('size', new GraphQLType('string', false, true)));
        fooType.addField(new GraphQLField('names', new GraphQLType('string', true, true)));
        fooType.addField(new GraphQLField('ages', new GraphQLType('string', true, false)));
        gqlSchema.addType(fooType);

        const catsType = new GraphQLObjectType('Cats');
        catsType.addField(new GraphQLField('id', new GraphQLType('string')));
        catsType.addField(new GraphQLField('eyecolor', new GraphQLType('string', false, true)));
        gqlSchema.addType(catsType);

        const fooInput = new GraphQLInput('Foo');
        fooInput.addField(new GraphQLInputField('id', 'string'));
        fooInput.addField(new GraphQLInputField('size', 'string'));
        gqlSchema.addInput(fooInput)

        const catsInput = new GraphQLInput('Cats');
        catsInput.addField(new GraphQLInputField('id', 'string'));
        catsInput.addField(new GraphQLInputField('eyecolor', 'string'));
        gqlSchema.addInput(catsInput)

        gqlSchema.addScalar('Cats');
        gqlSchema.addScalar('Dogs');

        const catsEnum = new GraphQLEnum('Cats');
        catsEnum.addValue('Fluffy');
        catsEnum.addValue('Pudge');
        gqlSchema.addEnum(catsEnum);

        const dogsEnum = new GraphQLEnum('Dogs');
        dogsEnum.addValue('Speedy');
        dogsEnum.addValue('Annie');
        gqlSchema.addEnum(dogsEnum);

        const str = format(gqlSchema.toString(), {parser: 'graphql'});
        expect(str).toEqual(format(loadGraphqlSchemaFromFile('complex.test'), {parser: 'graphql'}));
    });

    test('throws an exception when schema has no queries', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        expect(() => {
            gqlSchema.toString();
        }).toThrow('GraphQL Schema TestSchema must have at least one query to be converted to a string')
    });

    test('throws an exception when query has no response', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addQuery(new GraphQLQuery('TestQuery'));
        expect(() => {
            gqlSchema.toString();
        }).toThrow('Query TestQuery on GraphQL Schema TestSchema must have a valid response to be converted to a string')
    });

    test('throws an exception when enum has no values', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addQuery(new GraphQLQuery('TestQuery', new GraphQLType('string')));
        gqlSchema.addEnum(new GraphQLEnum('TestEnum'));
        expect(() => {
            gqlSchema.toString();
        }).toThrow('Enum TestEnum on GraphQL Schema TestSchema must have at least one value to be converted to a string');
    });

    test('throws an exception when type has no fields', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addQuery(new GraphQLQuery('TestQuery', new GraphQLType('string')));
        gqlSchema.addType(new GraphQLObjectType('TestType'));
        expect(() => {
            gqlSchema.toString();
        }).toThrow('Type TestType on GraphQL Schema TestSchema must have at least one field to be converted to a string');
    });

    test('throws an exception when input has no fields', () => {
        const gqlSchema = new GraphqlSchema('TestSchema');
        gqlSchema.addQuery(new GraphQLQuery('TestQuery', new GraphQLType('string')));
        gqlSchema.addInput(new GraphQLInput('TestInput'));
        expect(() => {
            gqlSchema.toString();
        }).toThrow('Input TestInput on GraphQL Schema TestSchema must have at least one field to be converted to a string');
    });
});