export type ESAggregateResponse = {
    data: any[],
    total: number,
    field: string
}

export type ESSearchResponse = {
    data: any[],
    total: number
};

export type ESSearchParams = {
    filter?: any, //TODO
    sourceFields?: string[],
    limit?: number,
    offset?: number,
    order_by?: string,
    order_how?: string,
    rootField: string
};

export type ESAggregateParams = {
    rootFilter?: any,
    fieldFilter?: any,
    limit: number,
    offset: number,
    order_by: string,
    order_how: string,
    field: string
}