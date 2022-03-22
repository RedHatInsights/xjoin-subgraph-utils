import {inputName} from "../avro/avroUtils.js";
import {GraphqlSchema} from "./graphqlschema.js";
import {SelectionNode} from "graphql";

//recursive function to build list of fields that will be included in the elasticsearch response
export function graphqlSelectionToESSourceFields(selectionSet: Readonly<SelectionNode[]>, sourceFields: string[], parent: string[]): string[] {
    for (const dataFieldSelection of selectionSet) {
        if (dataFieldSelection.kind !== 'Field') {
            throw new Error('invalid selection');
        }

        if (dataFieldSelection.selectionSet !== undefined) {
            const newParent = [...parent];
            newParent.push(dataFieldSelection.name.value)
            sourceFields = graphqlSelectionToESSourceFields(
                dataFieldSelection.selectionSet.selections, sourceFields, newParent);
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
export function graphqlFiltersToESFilters(parent: string[], queryFilters: Record<any, any>, esFilters: Record<any, any>[], schema: GraphqlSchema): Record<any, any>[] {
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
            esFilters = graphqlFiltersToESFilters(newParent, queryFilters[queryFilterKey], esFilters, schema);
        }
    }

    return esFilters;
}
