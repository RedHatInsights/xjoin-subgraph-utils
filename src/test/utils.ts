import nock, {Scope} from "nock";
import {ElasticSearchClient} from "../elasticsearch";
import {dirname} from "path";
import {fileURLToPath} from "url";
import {readFileSync} from "fs";


export function loadGraphqlSchemaFromFile(name: string): string {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return readFileSync(`${__dirname}/../test/graphqlSchemas/${name}.graphql`).toString();
}

export function loadAvroSchemaFromFile(name: string): string {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return readFileSync(`${__dirname}/../test/avroSchemas/${name}.json`).toString();
}


export type MockESConnection = {
    url: string,
    index: string,
    username: string,
    password: string
};

export const testESConnection: MockESConnection = {
    url: 'http://test.url:1234',
    index: 'test.index',
    username: 'testUsername',
    password: 'testPassword'
}

export function testElasticsearchClient() {
    return new ElasticSearchClient({
        node: testESConnection.url,
        auth: {
            username: testESConnection.username,
            password: testESConnection.password
        }
    }, testESConnection.index);
}

export type MockESQueryParameter = {
    key: string,
    value: string
}

export type MockESSearchAPIParams = {
    requestBody?: Record<any, any>,
    responseBody?: Record<any, any>,
    queryParameters?: MockESQueryParameter[],
    responseCode?: number,
    connection?: MockESConnection
}

// export function mockElasticsearchSearchAPICall(
//     elasticsearchRequestBody: Record<any, any> = {},
//     elasticsearchResponseBody: Record<any, any> = elasticsearchResponseTemplate(),
//     queryParameters?: MockESQueryParameter[],
//     responseCode = 200,
//     connection: MockESConnection = testESConnection
export function mockElasticsearchSearchAPICall(params: MockESSearchAPIParams): Scope {
    if (!params.requestBody) {
        params.requestBody = {}
    }

    if (!params.responseBody) {
        params.responseBody = elasticsearchResponseTemplate()
    }

    if (!params.connection) {
        params.connection = testESConnection
    }

    if (!params.responseCode) {
        params.responseCode = 200
    }

    let uri = `/${params.connection.index}/_search`;
    if (params.queryParameters) {
        for (let i = 0; i < params.queryParameters.length; i++) {
            const queryParam = params.queryParameters[i];
            if (i === 0) {
                uri = uri + '?';
            } else {
                uri = uri + '&';
            }
            uri = uri + encodeURI(queryParam.key) + '=' + encodeURI(queryParam.value);
        }
    }

    return nock(`${params.connection.url}`)
        .post(
            uri,
            params.requestBody,
            {
                reqheaders: {
                    'content-type': 'application/json'
                }
            })
        .basicAuth({user: params.connection.username, pass: params.connection.password})
        .reply(params.responseCode, params.responseBody, {'Content-Type': 'application/json'})
}

export type ESSource = {
    id: string,
    source: Record<any, any>
}

export function elasticsearchResponse(index: string, sources: ESSource[]) {
    const hits = sources.map(source => ({
            "_index": index,
            "_type": "_doc",
            "_id": source.id,
            "_score": 1.0,
            "_source": source.source
    }))

    return elasticsearchResponseTemplate(hits);
}

export type ESAggregateBucketTemplate = {
    count: number,
    value: string
}

export type ESAggregationTemplate = {
    name: string,
    buckets: ESAggregateBucketTemplate[]
}

export function elasticsearchResponseTemplate(hits?: Record<any, any>[], aggregations?: ESAggregationTemplate[]): Record<any, any> {
    if (!hits) {
        hits = [];
    }

    const response = {
        took: 1,
        timed_out: false,
        _shards: {
            'total': 3,
            'successful': 3,
            'skipped': 0,
            'failed': 0
        },
        max_score: 1.0,
        hits: {
            total: {
                value: hits.length,
                relation: 'eq'
            },
            max_score: null,
            hits: hits
        }
    }

    if (aggregations) {
        response['aggregations'] = {};

        for (const agg of aggregations) {
            response['aggregations'][agg.name] = {
                doc_count_error_upper_bound: 0,
                sum_other_doc_count: 0,
                buckets: []
            }

            for (const bucket of agg.buckets) {
                response['aggregations'][agg.name]['buckets'].push({
                    key: bucket.value,
                    doc_count: bucket.count,
                    doc_count_error_upper_bound: 0
                })
            }
        }
    }

    return response;
}

export function elasticsearchRequestTemplate(): Record<any, any> {
    return {
        "aggs": {
            "terms": {
                "terms": {
                    "size": 10000,
                    "order": [
                        {
                            "_key": "ASC"
                        }
                    ],
                    "show_term_doc_count_error": true
                }
            }
        },
        "query": {
            "bool": {
                "filter": []
            }
        },
        "_source": [],
        "size": 0
    };
}


