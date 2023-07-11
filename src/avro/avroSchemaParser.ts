import 'reflect-metadata';
import {
    GraphQLField,
    GraphQLInput, GraphQLInputField,
    GraphQLQuery,
    GraphQLQueryParameter,
    GraphqlSchema,
    GraphQLObjectType, GraphQLType
} from "../graphql/index.js";
import pluralize from "pluralize";
import {AvroSchema, Field} from "./avroSchema.js";
import {plainToInstance} from "class-transformer";
import {enumerationName, capitalize, inputName, typeName, orderByScalarName} from "./avroUtils.js";
import {GRAPHQL_FILTER_TYPES} from "../graphql/types.js";

export class AvroSchemaParser {
    avroSchema: AvroSchema;
    graphqlSchema: GraphqlSchema;

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

        this.graphqlSchema = new GraphqlSchema(this.avroSchema.fields[0].name);
    }

    convertToGraphQL(): GraphqlSchema {
        return this.parseAvroFields(this.avroSchema.fields, []);
    }

    /*
     * Recursive function to transform Avro Fields into a GraphQL Schema
     *
     * Each Avro field with xjoin.type=reference is transformed into the following:
     *   - GraphQL Query
     *   - GraphQL ORDER_BY enum
     *   - GraphQL Type
     *   - GraphQL Enumeration Query
     *   - GraphQL Filter
     *
     * Each child field of a reference that is an Object is transformed into the following:
     *   - GraphQL Input
     *   - GraphQL Type
     *   - GraphQL ORDER_BY enum
     *
     * Each child field of a reference field is recursively transformed into the following:
     *   - Added to it's parent's GraphQL Input Filter
     *   - Added to it's parent's GraphQL Object Type
     *   - Added to it's parent's Enumeration Query
     *   - Added to it's parent's ORDER_BY enum
     */
    parseAvroFields(fields: Field[], parent: string[]): GraphqlSchema {
        for (const field of fields) {
            //skip fields with xjoinIndex: false
            if (field.xjoinIndex !== undefined && !field.xjoinIndex) {
                continue;
            }

            field.validate();

            const fieldGQLType = field.getGraphQLType();

            if (fieldGQLType === 'Object' || fieldGQLType === 'Reference') {
                const fieldName: string = capitalize(field.name);
                const subFields = field.getChildren();

                let hasEnumeration = false;
                let hasPrimaryKey = false;

                if (subFields != null && subFields.length > 0) {
                    const fieldFilterInput = new GraphQLInput(inputName(fieldName));
                    const graphqlType = new GraphQLObjectType(typeName(fieldName));
                    const enumerationType = new GraphQLObjectType(typeName(enumerationName(fieldName)))

                    const newParent = [...parent];
                    newParent.push(field.name)
                    this.graphqlSchema = this.parseAvroFields(subFields, newParent);

                    //loop over each subField to build the graphql entities (type, input, enum, etc.)
                    for (const subField of subFields) {
                        if (subField.xjoinIndex !== undefined && !subField.xjoinIndex) {
                            continue;
                        }

                        subField.validate();

                        if (subField.getPrimaryKey() && hasPrimaryKey) {
                            throw Error(`multiple primary keys defined on ${field.name}`);
                        } else if (subField.getPrimaryKey()) {
                            graphqlType.addKey(subField.name);
                            hasPrimaryKey = true;
                        }

                        //update parent with xjoin.enumeration:true
                        //so the parent's enumeration type is added to the gql schema
                        if (subField.getEnumeration()) {
                            field.setEnumeration(true);
                            hasEnumeration = true;
                        }

                        if (subField.getFilterType() != "") {
                            fieldFilterInput.addField(new GraphQLInputField(subField.name, subField.getFilterType()));
                        }

                        const subFieldGQLType = subField.getGraphQLType();
                        if (subFieldGQLType === 'Object') {
                            if (subField.hasChildren()) {
                                //Objects with children are queryable as nested types
                                graphqlType.addField(new GraphQLField(subField.name, new GraphQLType(typeName(subField.name), false, false)));

                                //TODO: fieldname needs to include parent to avoid conflicts
                                if (subField.getEnumeration()) {
                                    enumerationType.addField(new GraphQLField(subField.name, new GraphQLType(typeName(enumerationName(subField.name)), false, false)));
                                }
                            } else {
                                //Objects without children are queryable as JSONObject scalars
                                graphqlType.addField(new GraphQLField(subField.name, new GraphQLType('JSONObject', false, false)));

                                //don't support enumerations for plain JSONObject fields
                                //enumerationType.addField(new GraphQLTypeField(subField.name, 'JSONObject', false, false));
                            }
                        } else {
                            const orderByValue = newParent.length > 1 ? `${newParent.slice(1).join('.')}.${subField.name}` : subField.name;
                            this.graphqlSchema.addRootOrderByField(orderByValue);
                            graphqlType.addField(new GraphQLField(subField.name, new GraphQLType(subFieldGQLType, false, false)));

                            if (subField.getEnumeration()) {
                                const enumerationField = buildEnumerationField(
                                    subFieldGQLType, subField.name, this.graphqlSchema.rootFilter)

                                if (enumerationField !== null) {
                                    enumerationType.addField(enumerationField);
                                }
                            }
                        }
                    }

                    //add the input and type entities to the graphql schema
                    this.graphqlSchema.addInput(fieldFilterInput);
                    this.graphqlSchema.addType(graphqlType);
                    if (field.getEnumeration()) {
                        this.graphqlSchema.addType(enumerationType);
                    }

                    //only top level Reference types are Queryable at the root level
                    //add the root entity types to the graphql schema
                    if (fieldGQLType === 'Reference') {
                        if (!hasPrimaryKey) {
                            throw Error(`missing xjoin.primary.key child field on reference field ${field.name}`)
                        }
                        this.graphqlSchema.addQuery(buildQuery(fieldName));
                        this.graphqlSchema.addType(buildCollectionType(graphqlType.name));
                        this.graphqlSchema.addScalar(orderByScalarName(fieldName));

                        if (hasEnumeration) {
                            this.graphqlSchema.addQuery(buildEnumerationQuery(fieldName));
                        }
                    }
                }
            }
        }

        return this.graphqlSchema;
    }
}

function buildEnumerationField(fieldGQLType: string, fieldName: string, rootFilter: string): GraphQLField | null {
    let fieldType = ''
    if (fieldGQLType === 'String') {
        fieldType = 'StringEnumeration';
    } else if (fieldGQLType === 'Boolean') {
        fieldType = 'BooleanEnumeration';
    }

    if (!fieldType) {
        throw new Error(`cannot use xjoin.enumeration with field type: ${fieldGQLType} on field: ${fieldName}`);
    }

    const enumerationField = new GraphQLField(fieldName, new GraphQLType(fieldType, false, false));
    enumerationField.addParameter(new GraphQLQueryParameter(rootFilter, rootFilter))
    enumerationField.addParameter(new GraphQLQueryParameter('filter', GRAPHQL_FILTER_TYPES.ENUMERATION_FILTER))
    enumerationField.addParameter(new GraphQLQueryParameter('limit', 'Int', '10'));
    enumerationField.addParameter(new GraphQLQueryParameter('offset', 'Int', '0'));
    enumerationField.addParameter(new GraphQLQueryParameter(
        'order_by', 'ENUMERATION_ORDER_BY', 'value'));
    enumerationField.addParameter(new GraphQLQueryParameter(
        'order_how', 'ORDER_DIR', 'ASC'));
    return enumerationField;
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
        'order_by', orderByScalarName(fieldName), 'id'));
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