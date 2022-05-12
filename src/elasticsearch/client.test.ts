import 'reflect-metadata';
import {
    elasticsearchResponse,
    mockElasticsearchSearchAPICall,
    testElasticsearchClient, testESConnection
} from "../test/utils.js";
import {ESSearchResponse} from "./types.js";

describe('rawQuery', () => {
    test('successfully executes a simple query', async () => {
        const query = {
            query: {
                bool: {
                    filter: {
                        term: {
                            id: '1'
                        }
                    }
                }
            }
        };

        const response = elasticsearchResponse(testESConnection.index,[{
            id: '1',
            source: {
                host: {
                    id: '1',
                    account: '1234'
                }
            }
        }]);

        const scope = mockElasticsearchSearchAPICall({
            requestBody: query,
            responseBody: response
        });
        const esResponse = await testElasticsearchClient().rawQuery(query);

        expect(esResponse.body).toEqual(response);
        expect(esResponse.headers).toEqual({'content-type': 'application/json'});
        expect(esResponse.statusCode).toEqual(200);
        scope.done();
    });

    test('throws an exception when request fails', async () => {
        const query = {
            query: {
                bool: {
                    filter: {
                        term: {
                            id: '1'
                        }
                    }
                }
            }
        };

        const response = {
            error: {
                root_cause: [
                    {
                        type: "index_not_found_exception",
                        reason: "no such index [test.invalid]",
                        'resource.type': "index_or_alias",
                        'resource.id': "test.invalid",
                        index_uuid: "_na_",
                        index: "test.invalid"
                    }
                ],
                type: "index_not_found_exception",
                reason: "no such index [test.invalid]",
                'resource.type': "index_or_alias",
                'resource.id': "test.invalid",
                index_uuid: "_na_",
                index: "test.invalid"
            },
            status: 404
        }

        const scope = mockElasticsearchSearchAPICall({
            requestBody: query,
            responseBody: response,
            responseCode: 404
        });

        await expect(testElasticsearchClient().rawQuery(query))
            .rejects
            .toThrow('index_not_found_exception: [index_not_found_exception] Reason: no such index [test.invalid]')

        scope.done();
    })
});

describe('search', () => {
    async function basicSearchTest(mockQuery, searchParams) {
        const mockResponse = elasticsearchResponse(testESConnection.index,[{
            id: '1',
            source: {
                host: {
                    id: '1'
                }
            }
        }]);

        const scope = mockElasticsearchSearchAPICall({
            requestBody: mockQuery,
            responseBody: mockResponse,
            queryParameters: [{
                key: 'filter_path',
                value: 'hits.hits._source,hits.total'
            }]
        });

        const response: ESSearchResponse = await testElasticsearchClient().search(searchParams);
        expect(response.total).toBe(1);
        expect(response.data).toEqual([{id: '1'}]);

        scope.done();
    }

    test('successfully executes a simple query', async () => {
        const mockQuery = {_source: ['id']};

        const searchParams = {
            sourceFields: ['id'],
            rootField: 'host'
        };

        basicSearchTest(mockQuery, searchParams);
    });

    test('adds sort parameters to elasticsearch query', async () => {
        const mockQuery = {
            _source: [
                "id"
            ],
            sort: [{
                id: 'ASC'
            }]
        };

        const searchParams = {
            sourceFields: ['id'],
            rootField: 'host',
            order_by: 'id',
            order_how: 'ASC',
        };

        basicSearchTest(mockQuery, searchParams);
    });

    test('adds pagination parameters to elasticsearch query', async () => {
        const mockQuery = {
            _source: [
                "id"
            ],
            from: 10,
            size: 50
        };

        const searchParams = {
            sourceFields: ['id'],
            rootField: 'host',
            limit: 50,
            offset: 10
        };

        basicSearchTest(mockQuery, searchParams);
    });

    test('adds filter to elasticsearch query', async () => {
        const mockQuery = {
            _source: [
                "id"
            ],
            query: {
                bool: {
                    filter: {
                        id: '1'
                    }
                }
            }
        };

        const searchParams = {
            sourceFields: ['id'],
            rootField: 'host',
            filter: {id: '1'}
        };

        basicSearchTest(mockQuery, searchParams);
    });

    test('responds with 0 results when es query has no hits', async () => {
        const mockQuery = {
            _source: [
                "id"
            ]
        };

        const searchParams = {
            sourceFields: ['id'],
            rootField: 'host'
        };

        const mockResponse = elasticsearchResponse(testESConnection.index,[]);

        const scope = mockElasticsearchSearchAPICall({
            requestBody: mockQuery,
            responseBody: mockResponse,
            queryParameters: [{
                key: 'filter_path',
                value: 'hits.hits._source,hits.total'
            }]
        });

        const response: ESSearchResponse = await testElasticsearchClient().search(searchParams);
        expect(response.total).toBe(0);
        expect(response.data).toEqual([]);

        scope.done();
    })

    test('throws an error when elasticsearch request fails', async () => {
        const mockQuery = {
            _source: [
                "asdf"
            ]
        };

        const searchParams = {
            sourceFields: ['asdf'],
            rootField: 'host'
        };

        const mockResponse = {
            error: {
                root_cause: [
                    {
                        type: "index_not_found_exception",
                        reason: "no such index [test.invalid]",
                        'resource.type': "index_or_alias",
                        'resource.id': "test.invalid",
                        index_uuid: "_na_",
                        index: "test.invalid"
                    }
                ],
                type: "index_not_found_exception",
                reason: "no such index [test.invalid]",
                'resource.type': "index_or_alias",
                'resource.id': "test.invalid",
                index_uuid: "_na_",
                index: "test.invalid"
            },
            status: 404
        }

        const scope = mockElasticsearchSearchAPICall({
            requestBody: mockQuery,
            responseBody: mockResponse,
            responseCode: 404,
            queryParameters: [{
                key: 'filter_path',
                value: 'hits.hits._source,hits.total'
            }]
        });

        await expect(testElasticsearchClient().search(searchParams))
            .rejects
            .toThrow('index_not_found_exception: [index_not_found_exception] Reason: no such index [test.invalid]')

        scope.done();
    })
});
