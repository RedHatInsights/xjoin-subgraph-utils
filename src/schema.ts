import got from "got";
import {XJoinSubgraphUtilsError} from "./errors.js";

export const ARTIFACTS_PATH = 'apis/registry/v2/groups/default/artifacts'

export type SchemaRegistryParams = {
    protocol: string,
    hostname: string,
    port: string,
    baseUrl?: string
}

export class SchemaRegistry {
    protocol: string;
    hostname: string;
    port: string;
    baseUrl: string;

    constructor(args: SchemaRegistryParams) {
        if (args.baseUrl) {
            this.baseUrl = args.baseUrl;
        } else {
            this.protocol = args.protocol;
            this.hostname = args.hostname;
            this.port = args.port;
            this.baseUrl = `${this.protocol}://${this.hostname}:${this.port}`;
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
            await got.get(url);
            artifactExists = true;
        } catch (e) {
            if (e && e.response && e.response.statusCode === 404) {
                artifactExists = false;
            } else {
                throw new XJoinSubgraphUtilsError('unable to check if existing artifact exists', e);
            }
        }

        if (artifactExists) {
            try {
                //apicurio artifact already exists, this will update it with the new schema
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
        } else {
            try {
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
                throw new XJoinSubgraphUtilsError('unable to create new schema', e);
            }
        }
    }
}
