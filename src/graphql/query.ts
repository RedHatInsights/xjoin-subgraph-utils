import {inputName} from "../avro/avroUtils.js";
import {GraphqlSchema} from "./graphqlschema.js";
import {SelectionNode} from "graphql";
import {Kind} from "graphql/language/kinds";

//recursive function to build list of fields that will be included in the elasticsearch response
export function graphqlSelectionToESSourceFields(parent: string[], selectionSet: Readonly<SelectionNode[]>, sourceFields: string[] = []): string[] {
    for (const dataFieldSelection of selectionSet) {
        if (dataFieldSelection.kind !== Kind.FIELD) {
            throw new Error(`invalid selection kind: ${dataFieldSelection.kind}`);
        }

        if (dataFieldSelection.selectionSet !== undefined) {
            const newParent = [...parent];
            newParent.push(dataFieldSelection.name.value)
            sourceFields = graphqlSelectionToESSourceFields(
                newParent, dataFieldSelection.selectionSet.selections, sourceFields);
        } else {
            if (parent.length > 0) {
                sourceFields.push(parent.join('.') + '.' + dataFieldSelection.name.value);
            } else {
                sourceFields.push(dataFieldSelection.name.value);
            }
        }
    }

    return sourceFields;
}

//recursive function to build elasticsearch filters
export function graphqlFiltersToESFilters(parent: string[], queryFilters: Record<any, any>, schema: GraphqlSchema, esFilters: Record<any, any>[] = []): Record<any, any>[] {
    const parentInputSchema = schema.getInput(inputName(parent[parent.length - 1]));

    for (const queryFilterKey in queryFilters) {
        const queryFilterType = parentInputSchema.getField(queryFilterKey).type;

        if (schema.defaultFilters.hasFilter(queryFilterType)) {
            const defaultFilter = schema.defaultFilters.getFilter(queryFilterType);
            esFilters.push(defaultFilter.buildESFilter(queryFilterKey, queryFilters[queryFilterKey], parent.join('.')));
        } else {
            //recurse into nested filter
            const newParent = [...parent];
            newParent.push(queryFilterKey)
            esFilters = graphqlFiltersToESFilters(newParent, queryFilters[queryFilterKey], schema, esFilters);
        }
    }

    return esFilters;
}
