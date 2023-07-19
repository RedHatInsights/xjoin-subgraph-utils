import got, {GotError} from "got";
import {XJoinSubgraphUtilsError} from "./errors.js";
import {Logger} from "./logging/logger.js";

export const ARTIFACTS_PATH = 'apis/registry/v2/groups/default/artifacts'

export type SchemaRegistryParams = {
    protocol: string,
    hostname: string,
    port: string
}

export class SchemaRegistry {
    protocol: string;
    hostname: string;
    port: string;
    baseUrl: string;

    constructor(args: SchemaRegistryParams) {
        this.protocol = args.protocol;
        this.hostname = args.hostname;
        this.port = args.port;
        this.baseUrl = `${this.protocol}://${this.hostname}:${this.port}`;
    }

    async updateExistingGraphQLSchema(schemaName: string, schema: string) {
        try {
            //apicurio artifact already exists, this will update it with the new schema
            Logger.debug("Updating existing GraphQL schema", {schemaName: schemaName})
            await got.post(
                `${this.baseUrl}/${ARTIFACTS_PATH}/${schemaName}/versions`,
                {
                    body: schema,
                    headers: {
                        'Content-Type': 'application/graphql',
                        'X-Registry-ArtifactType': 'GRAPHQL'
                    }
                });
        } catch (e) {
            throw new XJoinSubgraphUtilsError('unable to update existing schema', e);
        }
    }

    async registerGraphQLSchema(schemaName: string, schema: string) {
        if (!schemaName) {
            throw new XJoinSubgraphUtilsError('schemaName parameter is required')
        }

        if (!schema) {
            throw new XJoinSubgraphUtilsError('schema parameter is required')
        }

        let artifactExists = false;

        //check if artifact exists
        try {
            const url = `${this.baseUrl}/${ARTIFACTS_PATH}/${schemaName}`
            Logger.debug("Checking if GraphQL schema exists", {url: url})
            await got.get(url);
            artifactExists = true;
        } catch (e) {
            const gotError: GotError = <GotError> e;

            if (gotError && gotError.response) {
                Logger.debug("Error when trying to get existing GraphQL Schema", {
                    statusCode: gotError.response.statusCode, message: gotError.response.message});
            }

            if (gotError && gotError.response && gotError.response.statusCode === 404) {
                artifactExists = false;
            } else {
                throw new XJoinSubgraphUtilsError('unable to check if existing artifact exists', e);
            }
        }

        if (artifactExists) {
            await this.updateExistingGraphQLSchema(schemaName, schema)
        } else {
            try {
                Logger.debug("Creating new GraphQL schema", {schemaName: schemaName})
                await got.post(
                    `${this.baseUrl}/${ARTIFACTS_PATH}`,
                    {
                        body: schema,
                        headers: {
                            'Content-Type': 'application/graphql',
                            'X-Registry-ArtifactType': 'GRAPHQL',
                            'X-Registry-ArtifactId': schemaName
                        }
                    }
                )
            } catch (e) {
                const gotError: GotError = <GotError> e;

                if (gotError && gotError.response) {
                    Logger.debug("Error when trying to create a new GraphQL schema", {
                        statusCode: gotError.response.statusCode, response: gotError.response});
                }

                if (gotError && gotError.response && gotError.response.statusCode === 409) {
                    //artifact already exists, try updating it
                    await this.updateExistingGraphQLSchema(schemaName, schema)
                } else {
                    throw new XJoinSubgraphUtilsError('unable to create new schema', e);
                }

            }
        }
    }
}
