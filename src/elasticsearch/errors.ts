import {ApolloError} from "apollo-server-errors";

export class ElasticSearchError extends ApolloError {
    constructor(originalError: any, message = 'Elastic search error', code = 'ELASTIC_SEARCH_ERROR') {
        super(message, code, {originalError});
    }
}

export class ResultWindowError extends ElasticSearchError {
    constructor(originalError: any,
                message = 'Request could not be completed because the page is too deep',
                code = 'REQUEST_WINDOW_ERROR')
    {
        super(originalError, message, code);
    }
}
