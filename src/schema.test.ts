import {SchemaRegistry, ARTIFACTS_PATH} from './schema.js'
import nock from 'nock'

const SR_PROTOCOL = 'http'
const SR_HOSTNAME = 'localhost'
const SR_PORT = '1080'
const SIMPLE_GQL_SCHEMA = 'type Query {internalServerError: String}'

describe('schema registry', () => {
    test('updates an existing schema when the schema already exists', async () => {
        const schemaName = 'test'

        const scope = nock(`${SR_PROTOCOL}://${SR_HOSTNAME}:${SR_PORT}`)
            .get(`/${ARTIFACTS_PATH}/${schemaName}`)
            .reply(200, {})
            .post(`/${ARTIFACTS_PATH}/${schemaName}/versions`, SIMPLE_GQL_SCHEMA, {
                reqheaders: {
                    'Content-Type': 'application/graphql',
                    'X-Registry-ArtifactType': 'GRAPHQL'
                }
            })
            .reply(200, {}, {'Content-Type': 'application/json'})

        const sr = new SchemaRegistry({
            protocol: SR_PROTOCOL,
            hostname: SR_HOSTNAME,
            port: SR_PORT
        });

        await sr.registerGraphQLSchema(schemaName, SIMPLE_GQL_SCHEMA);
        scope.done()
    });

    test('creates a new schema when a schema does not yet exist', async () => {
        const schemaName = 'test'

        const scope = nock(`${SR_PROTOCOL}://${SR_HOSTNAME}:${SR_PORT}`)
            .get(`/${ARTIFACTS_PATH}/${schemaName}`)
            .reply(404)
            .post(`/${ARTIFACTS_PATH}`, SIMPLE_GQL_SCHEMA, {
                reqheaders: {
                    'Content-Type': 'application/graphql',
                    'X-Registry-ArtifactType': 'GRAPHQL'
                }
            })
            .reply(200, {}, {'Content-Type': 'application/json'})

        const sr = new SchemaRegistry({
            protocol: SR_PROTOCOL,
            hostname: SR_HOSTNAME,
            port: SR_PORT
        });

        await sr.registerGraphQLSchema(schemaName, SIMPLE_GQL_SCHEMA);
        scope.done()
    });

    test('throws an error when unable to check for existing schema', async () => {
        const schemaName = 'test'

        const scope = nock(`${SR_PROTOCOL}://${SR_HOSTNAME}:${SR_PORT}`)
            .get(`/${ARTIFACTS_PATH}/${schemaName}`)
            .reply(500, {})

        const sr = new SchemaRegistry({
            protocol: SR_PROTOCOL,
            hostname: SR_HOSTNAME,
            port: SR_PORT
        });

        await expect(sr.registerGraphQLSchema(schemaName, SIMPLE_GQL_SCHEMA))
            .rejects
            .toThrow('unable to check if existing artifact exists')

        scope.done()
    });

    test('throws an error when unable to create a new schema', async () => {
        const schemaName = 'test'

        const scope = nock(`${SR_PROTOCOL}://${SR_HOSTNAME}:${SR_PORT}`)
            .get(`/${ARTIFACTS_PATH}/${schemaName}`)
            .reply(404)
            .post(`/${ARTIFACTS_PATH}`, SIMPLE_GQL_SCHEMA, {
                reqheaders: {
                    'Content-Type': 'application/graphql',
                    'X-Registry-ArtifactType': 'GRAPHQL'
                }
            })
            .reply(500)


        const sr = new SchemaRegistry({
            protocol: SR_PROTOCOL,
            hostname: SR_HOSTNAME,
            port: SR_PORT
        });

        await expect(sr.registerGraphQLSchema(schemaName, SIMPLE_GQL_SCHEMA))
            .rejects
            .toThrow('unable to create new schema')

        scope.done()
    });

    test('throws an error when unable to update an existing schema', async () => {
        const schemaName = 'test'

        const scope = nock(`${SR_PROTOCOL}://${SR_HOSTNAME}:${SR_PORT}`)
            .get(`/${ARTIFACTS_PATH}/${schemaName}`)
            .reply(200)
            .post(`/${ARTIFACTS_PATH}/${schemaName}/versions`, SIMPLE_GQL_SCHEMA, {
                reqheaders: {
                    'Content-Type': 'application/graphql',
                    'X-Registry-ArtifactType': 'GRAPHQL'
                }
            })
            .reply(500)


        const sr = new SchemaRegistry({
            protocol: SR_PROTOCOL,
            hostname: SR_HOSTNAME,
            port: SR_PORT
        });

        await expect(sr.registerGraphQLSchema(schemaName, SIMPLE_GQL_SCHEMA))
            .rejects
            .toThrow('unable to update existing schema')

        scope.done()
    });

    test('throws an error when missing schemaName parameter', async () => {
        const sr = new SchemaRegistry({
            protocol: SR_PROTOCOL,
            hostname: SR_HOSTNAME,
            port: SR_PORT
        });
        await expect(sr.registerGraphQLSchema('', SIMPLE_GQL_SCHEMA))
            .rejects
            .toThrow('schemaName parameter is required')
    });

    test('throws an error when missing schema parameter', async () => {
        const sr = new SchemaRegistry({
            protocol: SR_PROTOCOL,
            hostname: SR_HOSTNAME,
            port: SR_PORT
        });
        await expect(sr.registerGraphQLSchema('schemaName', ''))
            .rejects
            .toThrow('schema parameter is required')
    });
})
