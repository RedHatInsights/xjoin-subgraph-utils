import {DefaultFilters} from "./default.filters.js";
import {enumerationName, inputName, orderByScalarName, queryName, typeName} from "../avro/avroUtils.js";

export class GraphQLEnum {
    name: string = "";
    values: string[] = [];

    constructor(name: string) {
        this.name = name;
    }

    addValue(value: string) {
        this.values.push(value);
    }
}

export class GraphQLInputField {
    name: string = "";
    type: string = "";

    constructor(name: string, type: string) {
        this.name = name;
        this.type = type;
    }
}

export class GraphQLInput {
    name: string = "";
    fields: GraphQLInputField[] = [];

    constructor(name: string) {
        this.name = name;
    }

    addField(field: GraphQLInputField) {
        this.fields.push(field);
    }

    getField(fieldName: string): GraphQLInputField {
        const field = this.fields.find(({name}) => name === fieldName);
        if (field === undefined || field === null) {
            throw new Error(`unable to find field: ${fieldName} on GraphQLInput ${this.name}`);
        }
        return field;
    }
}

/*
    This represents a single field of a gql type, e.g.

    Hosts(
      filter: HostFilter
      limit: Int = 10
      offset: Int = 0
      order_by: HOSTS_ORDER_BY = id
      order_how: ORDER_DIR = ASC
    ): Hosts!
 */
export class GraphQLField {
    name: string;
    type: GraphQLType;
    parameters: GraphQLQueryParameter[] = [];

    constructor(name: string, type: GraphQLType) {
        this.name = name;
        this.type = type;
    }

    addParameter(parameter: GraphQLQueryParameter) {
        this.parameters.push(parameter);
    }
}

/*
    This represents the type of field, e.g.

    Hosts
    Hosts!
    [Hosts]
    [Hosts]!
 */
export class GraphQLType {
    name: string;
    isArray: boolean = false;
    isRequired: boolean = false;

    constructor(name: string, isArray?: boolean, isRequired?: boolean) {
        this.name = name;

        if (isArray) {
            this.isArray = isArray;
        }

        if (isRequired) {
            this.isRequired = isRequired;
        }
    }

    toString(): string {
        const stringArray: string[] = [];

        if (this.isArray) {
            stringArray.push(`[${this.name}]`);
        } else {
            stringArray.push(this.name)
        }

        if (this.isRequired) {
            stringArray.push('!');
        }

        return stringArray.join('');
    }

    isScalar(): boolean {
        const scalars = ['String', 'Int', 'Boolean', 'Float', 'Id'];
        return scalars.includes(this.name);
    }

    isEnumerationScalar(): boolean {
        const scalars =
            ['StringEnumeration', 'IntEnumeration', 'BooleanEnumeration', 'FloatEnumeration', 'IdEnumeration'];
        return scalars.includes(this.name);
    }
}

/*
    This represents the type directive of the gql schema, e.g.

    type OperatingSystem @key(fields: "id") {
      major: String
      minor: String
      name: String
      id: String
    }
 */
export class GraphQLObjectType {
    name: string;
    fields: GraphQLField[] = [];
    keys: string[] = []; //apollo federation keys to uniquely identify the object

    constructor(name: string) {
        this.name = name;
    }

    addField(field: GraphQLField) {
        this.fields.push(field);
    }

    getFieldType(fieldName: string): GraphQLType {
        const field = this.fields.find(({name}) => name === fieldName);
        if (field === undefined || field === null) {
            throw new Error(`field ${fieldName} not found on GraphQLObjectType ${this.name}`);
        }
        return field.type;
    }

    addKey(name: string) {
        this.keys.push(name);
    }
}

export class GraphQLQueryParameter {
    name: string = "";
    type: string = "";
    defaultValue: string = "";

    constructor(name: string, type: string, defaultValue?: string) {
        this.name = name;
        this.type = type;
        if (defaultValue != null) {
            this.defaultValue = defaultValue;
        }
    }
}

export class GraphQLQuery {
    name: string = "";
    response: GraphQLType = new GraphQLType('', false, false);
    parameters: GraphQLQueryParameter[] = [];

    constructor(name: string, response?: GraphQLType) {
        this.name = name;
        if (response) {
            this.response = response;
        }
    }

    addParameter(parameter: GraphQLQueryParameter) {
        this.parameters.push(parameter);
    }
}

export class GraphqlSchema {
    queries: GraphQLQuery[] = [];
    types: GraphQLObjectType[] = [];
    scalars: string[] = [];
    enums: GraphQLEnum[] = [];
    inputs: GraphQLInput[] = [];
    schemaString: string = "";
    defaultFilters: DefaultFilters;
    rootQueryName: string = "";
    enumerationsRoot: string = "";
    rootFilter: string = "";
    rootOrderByScalarName: string = "";
    rootOrderByFields: string[] = [];
    avroRootName: string;

    constructor(avroRootName: string) {
        this.avroRootName = avroRootName;
        this.rootOrderByScalarName = orderByScalarName(avroRootName);
        this.rootQueryName = queryName(avroRootName);
        this.enumerationsRoot = typeName(enumerationName(avroRootName))
        this.rootFilter = inputName(avroRootName)

        //default enums
        const orderDirEnum = new GraphQLEnum('ORDER_DIR');
        orderDirEnum.addValue('ASC');
        orderDirEnum.addValue('DESC');
        this.enums.push(orderDirEnum)

        const enumerationOrderBy = new GraphQLEnum('ENUMERATION_ORDER_BY');
        enumerationOrderBy.addValue('value');
        enumerationOrderBy.addValue('count');
        this.enums.push(enumerationOrderBy)

        //default types
        const collectionMetaType = new GraphQLObjectType('CollectionMeta');
        collectionMetaType.addField(new GraphQLField('count', new GraphQLType('Int')));
        collectionMetaType.addField(new GraphQLField('total', new GraphQLType('Int')));
        this.types.push(collectionMetaType);

        //default enumeration types
        const stringEnumerationValueType = new GraphQLObjectType('StringEnumerationValue');
        stringEnumerationValueType.addField(new GraphQLField('value', new GraphQLType('String', false, true)));
        stringEnumerationValueType.addField(new GraphQLField('count', new GraphQLType('Int', false, true)));
        this.types.push(stringEnumerationValueType);

        const stringEnumerationType = new GraphQLObjectType('StringEnumeration');
        stringEnumerationType.addField(new GraphQLField('data', new GraphQLType('StringEnumerationValue', true, true)))
        stringEnumerationType.addField(new GraphQLField('meta', new GraphQLType('CollectionMeta', false, true)))
        this.types.push(stringEnumerationType);

        const booleanEnumerationValueType = new GraphQLObjectType('BooleanEnumerationValue');
        booleanEnumerationValueType.addField(new GraphQLField('value', new GraphQLType('Boolean', false, true)))
        booleanEnumerationValueType.addField(new GraphQLField('count', new GraphQLType('Int', false, true)))
        this.types.push(booleanEnumerationValueType);

        const booleanEnumerationType = new GraphQLObjectType('BooleanEnumeration');
        booleanEnumerationType.addField(new GraphQLField('data', new GraphQLType('BooleanEnumerationValue', true, true)))
        booleanEnumerationType.addField(new GraphQLField('meta', new GraphQLType('CollectionMeta', false, true)))
        this.types.push(booleanEnumerationType);

        //default scalars
        this.scalars.push('JSONObject')

        //default filters
        this.defaultFilters = new DefaultFilters();
        for (const defaultFilter of this.defaultFilters.filters) {
            this.inputs.push(defaultFilter.input);
        }
    }

    addQuery(query: GraphQLQuery) {
        this.queries.push(query);
    }

    getQuery(queryName: string) {
        const query = this.queries.find(({name}) => name === queryName);

        if (query === undefined || query === null) {
            throw new Error(`query ${queryName} not found on GraphQLSchema ${this.avroRootName}`);
        }
        return query;
    }

    addType(type: GraphQLObjectType) {
        this.types.push(type);
    }

    addScalar(scalar: string) {
        this.scalars.push(scalar);
    }

    addEnum(graphqlEnum: GraphQLEnum) {
        this.enums.push(graphqlEnum);
    }

    addRootOrderByField(field: string) {
        this.rootOrderByFields.push(field);
    }

    addInput(input: GraphQLInput) {
        this.inputs.push(input);
    }

    getInput(inputName: string): GraphQLInput {
        const input = this.inputs.find(({name}) => name === inputName);
        if (input === undefined) {
            throw new Error(`Input not found: ${inputName} on GraphQL Schema: ${this.avroRootName}`);
        }
        return input;
    }

    getObjectType(typeName: string): GraphQLObjectType {
        const type = this.types.find(({name}) => name === typeName);
        if (type === undefined) {
            throw new Error(`Object Type not found: ${typeName} on GraphQL Schema: ${this.avroRootName}`);
        }
        return type;
    }

    getTypeFromParent(parentName: string, childName: string): GraphQLType {
        const parentType = this.types.find(({name}) => name === parentName);
        if (parentType === undefined) {
            throw new Error(`Parent Type not found: ${parentName} on GraphQL Schema: ${this.avroRootName}`);
        }

        const childType = parentType.fields.find(({name}) => name === childName);
        if (childType === undefined) {
            throw new Error(`Child Type: ${childName} not found on parent: ${parentName} on GraphQL Schema: ${this.avroRootName}`);
        }
        return childType.type;
    }

    toString(refresh?: boolean): string {
        if (this.schemaString !== "" && !refresh) {
            return this.schemaString;
        }

        if (this.queries.length < 1) {
            throw new Error(`GraphQL Schema ${this.avroRootName} must have at least one query to be converted to a string`)
        }

        let fullString: string[] = [];

        //scalars
        for (const scalar of this.scalars) {
            fullString.push(`scalar ${scalar} `)
        }

        //enums
        for (const enumeration of this.enums) {
            const enumerationStringArray: string[] = [];
            enumerationStringArray.push(`enum ${enumeration.name} {`);

            if (enumeration.values.length < 1) {
                throw new Error(
                    `Enum ${enumeration.name} on GraphQL Schema ${this.avroRootName} ` +
                     `must have at least one value to be converted to a string`)
            }

            for (const value of enumeration.values) {
                if (value.includes('.')) {
                    enumerationStringArray.push(`"${value}",`);
                } else {
                    enumerationStringArray.push(value + ',');
                }
            }
            enumerationStringArray.push('}');
            fullString.push(enumerationStringArray.join(''));
        }

        //types
        for (const type of this.types) {
            if (type.fields.length < 1) {
                throw new Error(
                    `Type ${type.name} on GraphQL Schema ${this.avroRootName} ` +
                    `must have at least one field to be converted to a string`);
            }

            const typeStringArray: string[] = [];
            typeStringArray.push(`type ${type.name}`)

            //primary keys
            if (type.keys.length > 0) {
                for (const key of type.keys) {
                    typeStringArray.push(` @key(fields: "${key}")`);
                }
            }

            typeStringArray.push('{')
            for (const field of type.fields) {
                typeStringArray.push(field.name);

                if (field.parameters.length > 0) {
                    typeStringArray.push('(')
                    for (const param of field.parameters) {
                        let paramString = '';
                        paramString = `${param.name}: ${param.type}`;
                        if (param.defaultValue != null && param.defaultValue != "") {
                            paramString = paramString + ` = ${param.defaultValue}`
                        }
                        typeStringArray.push(paramString + ',');
                    }
                    typeStringArray.push(')')
                }

                typeStringArray.push(`: ${field.type.toString()}, `)
            }
            typeStringArray.push('}');
            fullString.push(typeStringArray.join(''));
        }

        //inputs
        for (const input of this.inputs) {
            if (input.fields.length < 1) {
                throw new Error(
                    `Input ${input.name} on GraphQL Schema ${this.avroRootName} ` +
                    `must have at least one field to be converted to a string`);
            }

            const inputStringArray: string[] = [];
            inputStringArray.push(`input ${input.name} {`);
            for (const field of input.fields) {
                inputStringArray.push(`${field.name}: ${field.type},`);
            }
            inputStringArray.push('}');
            fullString.push(inputStringArray.join(''));
        }

        //queries
        fullString.push('type Query {');
        for (const query of this.queries) {
            if (!query.response || query.response.name === '') {
                throw new Error(
                    `Query ${query.name} on GraphQL Schema ${this.avroRootName} ` +
                    `must have a valid response to be converted to a string`);
            }

            const queryStringArray: string[] = [];

            queryStringArray.push(query.name);
            if (query.parameters.length > 0) {
                queryStringArray.push(` (`);
                for (const param of query.parameters) {
                    let paramString = '';
                    paramString = `${param.name}: ${param.type}`;
                    if (param.defaultValue != null && param.defaultValue != "") {
                        paramString = paramString + ` = ${param.defaultValue}`
                    }
                    queryStringArray.push(paramString + ',');
                }
                queryStringArray.push(')');
            }
            queryStringArray.push(`: ${query.response.toString()} `);
            fullString.push(queryStringArray.join(''));
        }
        fullString.push('}');

        this.schemaString = fullString.join('');
        return this.schemaString;
    }
}