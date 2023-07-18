import got, {GotError} from "got";
import {XJoinSubgraphUtilsError} from "./errors.js";
import {Logger} from "./logging";

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

    constructor(args: SchemaRegistryParams) {
        this.protocol = args.protocol;
        this.hostname = args.hostname;
        this.port = args.port;
    }

    async registerGraphQLSchema(schemaName: string, schema: string) {
        if (!schemaName) {
            throw new XJoinSubgraphUtilsError('schemaName parameter is required')
        }

        if (!schema) {
            throw new XJoinSubgraphUtilsError('schema parameter is required')
        }

        const baseUrl = `${this.protocol}://${this.hostname}:${this.port}`;

        let artifactExists = false;

        //check if artifact exists
        try {
            const url = `${baseUrl}/${ARTIFACTS_PATH}/${schemaName}`
            Logger.debug("Checking if GraphQL schema exists", {url: url})
            await got.get(url);
            artifactExists = true;
        } catch (e) {
            const gotError: GotError = <GotError> e;
            Logger.debug("Error when trying to get existing GraphQL Schema", {error: gotError})

            if (gotError && gotError.response && gotError.response.statusCode === 404) {
                artifactExists = false;
            } else {
                throw new XJoinSubgraphUtilsError('unable to check if existing artifact exists', e);
            }
        }

        if (artifactExists) {
            try {
                //apicurio artifact already exists, this will update it with the new schema
                Logger.debug("Updating existing GraphQL schema", {schemaName: schemaName})
                await got.post(
                    `${baseUrl}/${ARTIFACTS_PATH}/${schemaName}/versions`,
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
        } else {
            try {
                Logger.debug("Creating new GraphQL schema", {schemaName: schemaName})
                await got.post(
                    `${baseUrl}/${ARTIFACTS_PATH}`,
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
                throw new XJoinSubgraphUtilsError('unable to create new schema', e);
            }
        }
    }
}
