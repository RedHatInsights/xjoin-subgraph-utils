import {Expose, Type as ClassType} from "class-transformer";
import {inputName} from "./avroUtils.js";

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

    getAvroType(): string {
        return this.typeConversion().avroType;
    }

    getXJoinType(): string {
        return this.typeConversion().xjoinType;
    }

    typeConversion(): FieldTypes {
        let typeString;
        let enumeration;
        let primaryKey = false;
        let avroType;
        let xjoinType;
        if (typeof this.type === 'string') {
            xjoinType = this.xjoinType;
            avroType = this.type;
            typeString = this.type; //TODO: xjoinType
            enumeration = this.xjoinEnumeration;
        } else if (Array.isArray(this.type)) {
            avroType = this.type[1].type;
            typeString = this.type[1].xjoinType;
            enumeration = this.type[1].xjoinEnumeration;
            primaryKey = this.type[1].xjoinPrimaryKey;
            xjoinType = this.type[1].xjoinType;
        } else { //single type object
            avroType = this.type.type;
            typeString = this.type.xjoinType;
            enumeration = this.type.xjoinEnumeration;
            primaryKey = this.type.xjoinPrimaryKey;
            xjoinType = this.type.xjoinType;
        }

        this.fieldTypes = {
            graphqlType: "",
            filterType: "",
            enumeration,
            primaryKey,
            avroType,
            xjoinType
        };

        switch (typeString) {
            case 'date_nanos': {
                this.fieldTypes.graphqlType = 'String';
                this.fieldTypes.filterType = 'FilterTimestamp';
                break;
            }
            case 'string': {
                this.fieldTypes.graphqlType = 'String';
                this.fieldTypes.filterType = 'FilterString';
                break;
            }
            case 'boolean': {
                this.fieldTypes.graphqlType = 'Boolean';
                this.fieldTypes.filterType = 'FilterBoolean';
                break;
            }
            case 'json': {
                this.fieldTypes.graphqlType = 'Object';

                if (this.hasChildren()) {
                    this.fieldTypes.filterType = inputName(this.name)
                } else {
                    this.fieldTypes.filterType = "";
                }
                break;
            }
            case 'record': { //TODO: is this a valid xjoin.type?
                this.fieldTypes.graphqlType = 'Object';
                this.fieldTypes.filterType = 'FilterString';
                break;
            }
            case 'reference': {
                this.fieldTypes.graphqlType = 'Reference';
                this.fieldTypes.filterType = 'FilterString';
                break;
            }
            case 'array': {
                this.fieldTypes.graphqlType = '[String]'; //TODO handle different array item types
                this.fieldTypes.filterType = 'FilterStringArray';
                break;
            }
            default: {
                this.fieldTypes.graphqlType = 'String';
                this.fieldTypes.filterType = 'FilterString';
                break;
            }
        }

        return this.fieldTypes;
    }

    getChildren() : Field[] {
        let childFields : Field[] = [];
        if (Array.isArray(this.type)) {
            childFields = this.type[1].fields; //TODO can't assume type[1]
            if (childFields.length === 0) {
                childFields = this.type[1].xjoinFields;
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
            this.type[1].xjoinEnumeration = value;
        } else { //single type object
            this.type.xjoinEnumeration = value;
        }

        this.xjoinEnumeration = value;
    }

    validate() {
        if (!this.name) {
            throw Error(`field is missing name attribute`)
        }
        if (!this.getAvroType()) {
            throw Error(`field ${this.name} is missing type attribute`)
        }
        if (!this.getXJoinType()) {
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
    avroType: string,
    xjoinType: string
}


