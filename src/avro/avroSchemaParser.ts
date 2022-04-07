import 'reflect-metadata';
import {
    GraphQLEnum, GraphQLField,
    GraphQLInput, GraphQLInputField,
    GraphQLQuery,
    GraphQLQueryParameter,
    GraphqlSchema,
    GraphQLObjectType, GraphQLType
} from "../graphql/graphqlschema.js";
import pluralize from "pluralize";
import {AvroSchema, Field} from "./avroSchema.js";
import {plainToInstance} from "class-transformer";
import {enumerationName, capitalize, inputName, typeName} from "./avroUtils.js";
import {FILTER_TYPES} from "../graphql/types.js";

export class AvroSchemaParser {
    avroSchema: AvroSchema;

    constructor(avroSchema: string) {
        if (!avroSchema) {
            throw Error('avroSchema is a required parameter to create an AvroSchemaParser');
        }

        this.avroSchema = plainToInstance(AvroSchema, JSON.parse(avroSchema));

        if (this.avroSchema.type !== 'record') {
            throw Error('avroSchema type must be "record"');
        }

        if (!this.avroSchema.name) {
            throw Error('avroSchema must have a name');
        }

        if (this.avroSchema.fields.length !== 1) {
            throw Error('avroSchema must contain a single root field');
        }

        if (!this.avroSchema.fields[0].name) {
            throw Error('avroSchema root field must have a name');
        }

        if (this.avroSchema.fields[0].getAvroType() !== 'record') {
            throw Error('avroSchema root field must be type=record')
        }

        if (this.avroSchema.fields[0].getXJoinType() !== 'reference') {
            throw Error('avroSchema root field must be xjoin.type=reference')
        }

        if (typeof this.avroSchema.fields[0].type === 'string' || Array.isArray(this.avroSchema.fields[0].type)) {
            throw Error('avroSchema root field type must be an object containing at least one field')
        } else if (this.avroSchema.fields[0].type.fields.length < 1) {
            throw Error('avroSchema root field must contain at least one child field')
        }
    }

    convertToGraphQL(): GraphqlSchema {
        let graphqlSchema = new GraphqlSchema(this.avroSchema.fields[0].name);
        graphqlSchema = this.parseAvroFields(this.avroSchema.fields, graphqlSchema);
        return graphqlSchema;
    }

    parseAvroFields(fields: Field[], graphqlSchema: GraphqlSchema): GraphqlSchema {
        for (const field of fields) {
            //skip fields with xjoinIndex: false
            if (field.xjoinIndex !== undefined && !field.xjoinIndex) {
                continue;
            }

            const fieldGQLType = field.getGraphQLType();

            if (fieldGQLType === 'Object' || fieldGQLType === 'Reference') {
                const fieldName: string = capitalize(field.name);
                const subFields = field.getChildren();

                let hasEnumeration = false;
                let hasPrimaryKey = false;

                if (subFields != null && subFields.length > 0) {
                    graphqlSchema = this.parseAvroFields(subFields, graphqlSchema);

                    const graphqlInput = new GraphQLInput(inputName(fieldName));
                    const orderByEnum = new GraphQLEnum(orderByEnumName(fieldName));
                    const graphqlType = new GraphQLObjectType(typeName(fieldName));

                    const enumerationType = new GraphQLObjectType(typeName(enumerationName(fieldName)))

                    for (const subField of subFields) {
                        if (!subField.name) {
                            throw Error(`child field of ${field.name} is missing name attribute`)
                        }
                        if (!subField.getAvroType()) {
                            throw Error(`child field of ${field.name} is missing type attribute`)
                        }
                        if (!subField.getXJoinType()) {
                            throw Error(`child field of ${field.name} is missing xjoin.type attribute`)
                        }

                        //update parent with xjoin.enumeration:true
                        //so the parent's enumeration type is added to the gql schema
                        if (subField.getEnumeration()) {
                            field.setEnumeration(true);
                            hasEnumeration = true;
                        }

                        if (subField.getFilterType() != "") {
                            graphqlInput.addField(new GraphQLInputField(subField.name, subField.getFilterType()));
                        }
                        orderByEnum.addValue(subField.name);

                        const subFieldGQLType = subField.getGraphQLType();
                        if (subFieldGQLType === 'Object') {
                            if (subField.hasChildren()) {
                                graphqlType.addField(new GraphQLField(subField.name, new GraphQLType(typeName(subField.name), false, false)));
                                if (subField.getPrimaryKey() && hasPrimaryKey) {
                                    throw Error(`multiple primary keys defined on ${field.name}`);
                                } else if (subField.getPrimaryKey()) {
                                    graphqlType.addKey(subField.name);
                                    hasPrimaryKey = true;
                                }

                                //TODO: fieldname needs to include parent to avoid conflicts
                                if (subField.getEnumeration()) {
                                    enumerationType.addField(new GraphQLField(subField.name, new GraphQLType(typeName(enumerationName(subField.name)), false, false)));
                                }
                            } else {
                                graphqlType.addField(new GraphQLField(subField.name, new GraphQLType('JSONObject', false, false)));
                                if (subField.getPrimaryKey() && hasPrimaryKey) {
                                    throw Error(`multiple primary keys defined on ${field.name}`);
                                } else if (subField.getPrimaryKey()) {
                                    graphqlType.addKey(subField.name);
                                    hasPrimaryKey = true;
                                }

                                //don't support enumerations for plain JSONObject fields
                                //enumerationType.addField(new GraphQLTypeField(subField.name, 'JSONObject', false, false));
                            }
                        } else {
                            graphqlType.addField(new GraphQLField(subField.name, new GraphQLType(subFieldGQLType, false, false)));
                            if (subField.getPrimaryKey() && hasPrimaryKey) {
                                throw Error(`multiple primary keys defined on ${field.name}`);
                            } else if (subField.getPrimaryKey()) {
                                graphqlType.addKey(subField.name);
                                hasPrimaryKey = true;
                            }

                            if (subField.getEnumeration()) {
                                let fieldType = ''
                                if (subFieldGQLType === 'String') {
                                    fieldType = 'StringEnumeration';
                                } else if (subFieldGQLType === 'Boolean') {
                                    fieldType = 'BooleanEnumeration';
                                }

                                const enumerationField = new GraphQLField(subField.name, new GraphQLType(fieldType, false, false));
                                enumerationField.addParameter(new GraphQLQueryParameter(graphqlSchema.rootFilter, graphqlSchema.rootFilter))
                                enumerationField.addParameter(new GraphQLQueryParameter('filter', FILTER_TYPES.AGGREGATION_FILTER))
                                enumerationField.addParameter(new GraphQLQueryParameter('limit', 'Int', '10'));
                                enumerationField.addParameter(new GraphQLQueryParameter('offset', 'Int', '0'));
                                enumerationField.addParameter(new GraphQLQueryParameter(
                                    'order_by', 'ENUMERATION_ORDER_BY', 'value'));
                                enumerationField.addParameter(new GraphQLQueryParameter(
                                    'order_how', 'ORDER_DIR', 'ASC'));

                                if (fieldType !== '') {
                                    enumerationType.addField(enumerationField);
                                }
                            }
                        }
                    }

                    graphqlSchema.addInput(graphqlInput);
                    graphqlSchema.addType(graphqlType);

                    if (field.getEnumeration()) {
                        graphqlSchema.addType(enumerationType);
                    }

                    //only top level Reference types are Queryable at the root level
                    if (fieldGQLType === 'Reference') {
                        if (!hasPrimaryKey) {
                            throw Error(`missing xjoin.primary.key child field on reference field ${field.name}`)
                        }
                        graphqlSchema.addQuery(buildQuery(fieldName));
                        graphqlSchema.addEnum(orderByEnum);
                        graphqlSchema.addType(buildCollectionType(graphqlType.name));

                        if (hasEnumeration) {
                            graphqlSchema.addQuery(buildEnumerationQuery(fieldName));
                        }
                    }
                }
            }
        }

        return graphqlSchema;
    }
}

function buildEnumerationQuery(fieldName: string): GraphQLQuery {
    const graphqlQuery = new GraphQLQuery(enumerationName(fieldName))
    graphqlQuery.response = new GraphQLType(enumerationName(fieldName), false, true);
    return graphqlQuery
}

function buildQuery(fieldName: string): GraphQLQuery {
    const fieldNamePlural: string = pluralize(fieldName);

    const graphqlQuery = new GraphQLQuery(fieldNamePlural);
    graphqlQuery.addParameter(new GraphQLQueryParameter('filter', `${fieldName}Filter`));
    graphqlQuery.addParameter(new GraphQLQueryParameter('limit', 'Int', '10'));
    graphqlQuery.addParameter(new GraphQLQueryParameter('offset', 'Int', '0'));
    graphqlQuery.addParameter(new GraphQLQueryParameter(
        'order_by', orderByEnumName(fieldName), 'id'));
    graphqlQuery.addParameter(new GraphQLQueryParameter(
        'order_how', 'ORDER_DIR', 'ASC'));
    graphqlQuery.response = new GraphQLType(fieldNamePlural, false, true);
    return graphqlQuery;
}

function buildCollectionType(typeName: string): GraphQLObjectType {
    const graphqlType = new GraphQLObjectType(pluralize(typeName));

    const graphqlField = new GraphQLField('data', new GraphQLType(`${typeName}`, true, true));
    graphqlType.addField(graphqlField);

    const collectionField = new GraphQLField('meta', new GraphQLType('CollectionMeta', false, true));
    graphqlType.addField(collectionField);

    return graphqlType;
}

function orderByEnumName(fieldName: string): string {
    let response = pluralize(fieldName).toUpperCase();
    response = response + "_ORDER_BY"
    return response;
}
