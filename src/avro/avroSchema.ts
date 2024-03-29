import {Expose, Type as ClassType} from "class-transformer";
import {inputName} from "./avroUtils.js";
import {GRAPHQL_TYPES, GRAPHQL_FILTER_TYPES} from "../graphql/types.js";
import {XJOIN_TYPES} from "./types.js";

export class AvroSchema  {
    @ClassType(() => Type) //TODO: handle all three types
    type: string | Type | Type[] = "";

    @ClassType(() => Field)
    fields: Field[] = [];

    @ClassType(() => Transformation)
    transformations: Transformation[] = [];

    @Expose({ name: 'xjoin.type' })
    xjoinType: string = "";

    name: string = "";
    namespace: string = "";
    connectName: string = "";
}

export class Type {
    @ClassType(() => Type) //TODO: handle all three types
    items: string | Type | Type[] = "";

    @ClassType(() => Field)
    fields: Field[] = [];

    @ClassType(() => Field)
    @Expose({ name: 'xjoin.fields' })
    xjoinFields: Field[] = [];

    @Expose({ name: 'xjoin.type' })
    xjoinType: string = "";

    @Expose({ name: 'connect.version' })
    connectVersion: bigint = BigInt(1);

    @Expose({ name: 'connect.name' })
    connectName: string = "";

    @Expose({ name: 'xjoin.case' })
    xjoinCase: string = "";

    @Expose({ name: 'xjoin.enumeration' })
    xjoinEnumeration: boolean = false;

    @Expose({ name: 'xjoin.primary.key' })
    xjoinPrimaryKey: boolean = false;

    type: string = "";
    name: string = "";
}

export class Field {
    @ClassType(() => Type)
    type: string | Type | Type[] = "";

    @Expose({ name: 'xjoin.index' })
    xjoinIndex: boolean = true;

    @Expose({ name: 'xjoin.type' })
    xjoinType: string = "";

    @Expose({ name: 'xjoin.enumeration' })
    xjoinEnumeration: boolean = true;

    @Expose({ name: 'xjoin.primary.key' })
    xjoinPrimaryKey: boolean = false;

    name: string = "";
    default: string = "";

    fieldTypes: FieldTypes | undefined = undefined;

    getGraphQLType() : string {
        return this.typeConversion().graphqlType;
    }

    getFilterType() : string {
        return this.typeConversion().filterType;
    }

    getEnumeration(): boolean {
        return this.typeConversion().enumeration;
    }

    getPrimaryKey(): boolean {
        return this.typeConversion().primaryKey;
    }

    getAvroType(): string|Type|Type[] {
        return this.typeConversion().avroType;
    }

    getXJoinType(): string {
        return this.typeConversion().xjoinType;
    }

    getTypeObject(): Type|this|undefined {
        let type;
        if (typeof this.type === 'string') {
            type = this;
        } else if (Array.isArray(this.type)) {
            const errorMessage =
                `Invalid field: ${this.name}. ` +
                'Fields are only allowed to have at most 2 types. When more than one type is used, ' +
                'the first must be null and the second must be a valid type object.';
            if (this.type.length > 2) {
                throw new Error(errorMessage);
            } else if (this.type.length === 1) {
                type = this.type[0];
            } else if (this.type.length === 2) {
                if (this.type[0].type !== 'null') {
                    throw new Error(errorMessage);
                }
                type = this.type[1];
            }
        } else {
            type = this.type;
        }
        return type;
    }

    typeConversion(): FieldTypes {
        const type = this.getTypeObject();

        if (type === undefined) {
            throw Error(`missing type during type conversion`)
        }

        const fieldTypes : FieldTypes = {
            graphqlType: "",
            filterType: "",
            enumeration: type.xjoinEnumeration ? type.xjoinEnumeration : false,
            primaryKey: type.xjoinPrimaryKey ? type.xjoinPrimaryKey : false,
            avroType: type.type,
            xjoinType: type.xjoinType
        };

        switch (type.xjoinType) {
            case XJOIN_TYPES.date_nanos: {
                fieldTypes.graphqlType = GRAPHQL_TYPES.String;
                fieldTypes.filterType = GRAPHQL_FILTER_TYPES.FILTER_TIMESTAMP;
                break;
            }
            case XJOIN_TYPES.string: {
                fieldTypes.graphqlType = GRAPHQL_TYPES.String;
                fieldTypes.filterType = GRAPHQL_FILTER_TYPES.FILTER_STRING;
                break;
            }
            case XJOIN_TYPES.boolean: {
                fieldTypes.graphqlType = GRAPHQL_TYPES.Boolean;
                fieldTypes.filterType = GRAPHQL_FILTER_TYPES.FILTER_BOOLEAN;
                break;
            }
            case XJOIN_TYPES.json: {
                fieldTypes.graphqlType = GRAPHQL_TYPES.Object;

                if (this.hasChildren()) {
                    fieldTypes.filterType = inputName(this.name)
                } else {
                    fieldTypes.filterType = "";
                }
                break;
            }
            case XJOIN_TYPES.reference: {
                fieldTypes.graphqlType = GRAPHQL_TYPES.Reference;
                fieldTypes.filterType = GRAPHQL_FILTER_TYPES.FILTER_STRING;
                break;
            }
            case XJOIN_TYPES.array: {
                fieldTypes.graphqlType = GRAPHQL_TYPES.StringArray; //TODO handle different array item types
                fieldTypes.filterType = GRAPHQL_FILTER_TYPES.FILTER_STRING_ARRAY;
                break;
            }
            case XJOIN_TYPES.byte: {
                fieldTypes.graphqlType = GRAPHQL_TYPES.String;
                fieldTypes.filterType = GRAPHQL_FILTER_TYPES.FILTER_STRING;
                break;
            }
            default: {
                throw Error(`encountered invalid xjoin.type: ${type.xjoinType} on field: ${this.name}`)
            }
        }

        this.fieldTypes = fieldTypes
        return this.fieldTypes;
    }

    getChildren() : Field[] {
        let childFields : Field[] = [];
        if (Array.isArray(this.type)) {
            if (this.type.length === 1) {
                childFields = this.type[0].fields;
            } else {
                childFields = this.type[1].fields;
            }

            if (childFields.length === 0) {
                if (this.type.length === 1) {
                    childFields = this.type[0].xjoinFields;
                } else {
                    childFields = this.type[1].xjoinFields;
                }
            }
        } else if (typeof this.type === 'object') {
            childFields = this.type.fields;
            if (childFields.length === 0) {
                childFields = this.type.xjoinFields;
            }
        }
        return childFields;
    }

    hasChildren() : boolean {
        const children = this.getChildren();
        return children != null && children.length > 0;
    }

    setEnumeration(value: boolean) {
        if (typeof this.type === 'string') {
            this.xjoinEnumeration = true;
        } else if (Array.isArray(this.type)) {
            if (this.type.length === 1) {
                this.type[0].xjoinEnumeration = value;
            } else {
                this.type[1].xjoinEnumeration = value;
            }
        } else { //single type object
            this.type.xjoinEnumeration = value;
        }

        this.xjoinEnumeration = value;
    }

    validate() {
        if (!this.name) {
            throw Error(`field is missing name attribute`)
        }
        const typeObject = this.getTypeObject()
        if (typeObject === undefined) {
            throw Error(`type object is undefined`)
        }
        if (!typeObject.type) {
            throw Error(`field ${this.name} is missing type attribute`)
        }
        if (!typeObject.xjoinType) {
            throw Error(`field ${this.name} is missing xjoin.type attribute`)
        }
    }
}

export class Transformation {
    @Expose({ name: 'input.field' })
    inputField: string = "";

    @Expose({ name: 'output.field' })
    outputField: string = "";

    type: string = "";
    parameters: object = {};
}

type FieldTypes = {
    graphqlType: string,
    filterType: string,
    enumeration: boolean,
    primaryKey: boolean,
    avroType: string|Type|Type[],
    xjoinType: string
}


