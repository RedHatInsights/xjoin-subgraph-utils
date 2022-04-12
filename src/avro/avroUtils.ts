import camelcase from "camelcase";
import pluralize from "pluralize";

export function inputName(fieldName: string): string {
    return camelcase(fieldName, {pascalCase: true, preserveConsecutiveUppercase: true}) + "Filter";
}

export function typeName(dirtyName: string): string {
    return camelcase(dirtyName, {pascalCase: true, preserveConsecutiveUppercase: true});
}

export function queryName(dirtyName: string): string {
    return pluralize(camelcase(dirtyName, {pascalCase: true, preserveConsecutiveUppercase: true}));
}

export function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

export function enumerationName(dirtyName: string): string {
    return dirtyName + 'Enumeration';
}

export function orderByScalarName(fieldName: string): string {
    return queryName(fieldName) + "OrderBy";
}
