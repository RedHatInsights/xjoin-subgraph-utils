import got from "got";

const ARTIFACTS_PATH = 'apis/registry/v2/groups/default/artifacts'

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
        const baseUrl = `${this.protocol}://${this.hostname}:${this.port}`;
        await got.get(`${baseUrl}/${ARTIFACTS_PATH}/${schemaName}`);
        await got.post(
            `${baseUrl}/${ARTIFACTS_PATH}/${schemaName}/versions`,
            {
                body: schema,
                headers: {
                    'Content-Type': 'application/graphql',
                    'X-Registry-ArtifactType': 'GRAPHQL'
                }
            });
    }
}
