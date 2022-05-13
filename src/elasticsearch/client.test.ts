import 'reflect-metadata';
import {
    elasticsearchResponse, elasticsearchResponseTemplate,
    mockElasticsearchSearchAPICall,
    testElasticsearchClient, testESConnection
} from "../test/utils.js";
import {ESEnumerationResponse, ESSearchResponse} from "./types.js";

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

        const response = elasticsearchResponse(testESConnection.index, [{
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
        const mockResponse = elasticsearchResponse(testESConnection.index, [{
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

        await basicSearchTest(mockQuery, searchParams);
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

        await basicSearchTest(mockQuery, searchParams);
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

        await basicSearchTest(mockQuery, searchParams);
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

        await basicSearchTest(mockQuery, searchParams);
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

        const mockResponse = elasticsearchResponse(testESConnection.index, []);

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

describe('enumerationQuery', () => {
    async function basicEnumerationTest(mockQuery, mockResponse, enumerationParams) {
        const scope = mockElasticsearchSearchAPICall({
            requestBody: mockQuery,
            responseBody: mockResponse
        });

        const response: ESEnumerationResponse = await testElasticsearchClient().enumerationQuery(enumerationParams);
        expect(response.field).toBe('reporter');
        expect(response.data).toEqual([{
            "value": "puptoo",
            "count": 1
        }]);
        expect(response.total).toBe(1);

        scope.done();
    }

    test('successfully performs a basic query', async () => {
        const mockQuery = {
            _source: [],
            size: 0,
            aggs: {
                reporter: {
                    terms: {
                        field: 'reporter',
                        size: '10000',
                        order: [{
                            _key: 'ASC'
                        }],
                        show_term_doc_count_error: true
                    }
                }
            }
        };

        const mockResponse = elasticsearchResponseTemplate([], [{
            name: 'reporter',
            buckets: [{
                value: 'puptoo',
                count: 1
            }]
        }]);

        const enumerationParams = {
            field: 'reporter',
            limit: 10,
            offset: 0,
            order_by: 'value',
            order_how: 'ASC'
        };

        await basicEnumerationTest(mockQuery, mockResponse, enumerationParams);
    });

    test('throws an error when aggregation is missing from ES response', async () => {
        const mockQuery = {
            _source: [],
            size: 0,
            aggs: {
                id: {
                    terms: {
                        field: 'id',
                        size: '10000',
                        order: [{
                            _key: 'ASC'
                        }],
                        show_term_doc_count_error: true
                    }
                }
            }
        };

        const mockResponse = elasticsearchResponseTemplate([], [{
            name: 'reporter',
            buckets: [{
                value: 'puptoo',
                count: 1
            }]
        }]);

        const enumerationParams = {
            field: 'id',
            limit: 10,
            offset: 0,
            order_by: 'value',
            order_how: 'ASC'
        };

        const scope = mockElasticsearchSearchAPICall({
            requestBody: mockQuery,
            responseBody: mockResponse
        });

        await expect(testElasticsearchClient().enumerationQuery(enumerationParams))
            .rejects
            .toThrow('Elasticsearch response is missing the aggregation for field: id')
        scope.done();
    });

    test('correctly parses order_by=value', async () => {
        const mockQuery = {
            _source: [],
            size: 0,
            aggs: {
                reporter: {
                    terms: {
                        field: 'reporter',
                        size: '10000',
                        order: [{
                            _key: 'DESC'
                        }],
                        show_term_doc_count_error: true
                    }
                }
            }
        };

        const mockResponse = elasticsearchResponseTemplate([], [{
            name: 'reporter',
            buckets: [{
                value: 'puptoo',
                count: 1
            }]
        }]);

        const enumerationParams = {
            field: 'reporter',
            limit: 10,
            offset: 0,
            order_by: 'value',
            order_how: 'DESC'
        };

        await basicEnumerationTest(mockQuery, mockResponse, enumerationParams);
    });

    test('correctly parses order_by=count', async () => {
        const mockQuery = {
            _source: [],
            size: 0,
            aggs: {
                reporter: {
                    terms: {
                        field: 'reporter',
                        size: '10000',
                        order: [{
                            _count: 'ASC'
                        }],
                        show_term_doc_count_error: true
                    }
                }
            }
        };

        const mockResponse = elasticsearchResponseTemplate([], [{
            name: 'reporter',
            buckets: [{
                value: 'puptoo',
                count: 1
            }]
        }]);

        const enumerationParams = {
            field: 'reporter',
            limit: 10,
            offset: 0,
            order_by: 'count',
            order_how: 'ASC'
        };

        await basicEnumerationTest(mockQuery, mockResponse, enumerationParams);
    });

    test('correctly adds fieldFilter.search.regex to ES query', async () => {
        const mockQuery = {
            _source: [],
            size: 0,
            aggs: {
                reporter: {
                    terms: {
                        field: 'reporter',
                        size: '10000',
                        order: [{
                            _count: 'ASC'
                        }],
                        show_term_doc_count_error: true,
                        include: '.*puptoo.*'
                    }
                }
            }
        };

        const mockResponse = elasticsearchResponseTemplate([], [{
            name: 'reporter',
            buckets: [{
                value: 'puptoo',
                count: 1
            }]
        }]);

        const enumerationParams = {
            fieldFilter: {
                search: {
                    regex: '.*puptoo.*'
                }
            },
            field: 'reporter',
            limit: 10,
            offset: 0,
            order_by: 'count',
            order_how: 'ASC'
        };

        await basicEnumerationTest(mockQuery, mockResponse, enumerationParams);
    });

    test('correctly adds fieldFilter.search.eq to ES query', async () => {
        const mockQuery = {
            _source: [],
            size: 0,
            aggs: {
                reporter: {
                    terms: {
                        field: 'reporter',
                        size: '10000',
                        order: [{
                            _count: 'ASC'
                        }],
                        show_term_doc_count_error: true,
                        include: ['puptoo']
                    }
                }
            }
        };

        const mockResponse = elasticsearchResponseTemplate([], [{
            name: 'reporter',
            buckets: [{
                value: 'puptoo',
                count: 1
            }]
        }]);

        const enumerationParams = {
            fieldFilter: {
                search: {
                    eq: 'puptoo'
                }
            },
            field: 'reporter',
            limit: 10,
            offset: 0,
            order_by: 'count',
            order_how: 'ASC'
        };

        await basicEnumerationTest(mockQuery, mockResponse, enumerationParams);
    });

    test('correctly applies limit/offset to ES query response', async () => {
        const mockQuery = {
            _source: [],
            size: 0,
            aggs: {
                reporter: {
                    terms: {
                        field: 'reporter',
                        size: '10000',
                        order: [{
                            _count: 'ASC'
                        }],
                        show_term_doc_count_error: true
                    }
                }
            }
        };

        const mockResponse = elasticsearchResponseTemplate([], [{
            name: 'reporter',
            buckets: [{
                value: 'puptoo',
                count: 1
            }, {
                value: 'foo',
                count: 2
            }, {
                value: 'bar',
                count: 3
            }]
        }]);

        const enumerationParams = {
            field: 'reporter',
            limit: 1,
            offset: 1,
            order_by: 'count',
            order_how: 'ASC'
        };

        const scope = mockElasticsearchSearchAPICall({
            requestBody: mockQuery,
            responseBody: mockResponse
        });

        const response: ESEnumerationResponse = await testElasticsearchClient().enumerationQuery(enumerationParams);
        expect(response.field).toBe('reporter');
        expect(response.data).toEqual([{
            'value': 'foo',
            'count': 2
        }]);
        expect(response.total).toBe(3);

        scope.done();
    });
});
