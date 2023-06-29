import { app, HttpRequest, HttpResponseInit, input, InvocationContext, output } from "@azure/functions";

interface TableRow {
    PartitionKey: string;
    RowKey: string;
    AcsUserId: string;
}

const tableInput = input.generic({
    type: 'table',
    tableName: 'UserMappings',
    connection: 'TableStorageConnectionString',
    direction: 'in',
    name: 'tableBindingIn',
    partitionKey: '{client_id}_{object_id}',
    rowKey: '{object_id}'
});

const tableOutput = output.generic({
    type: 'table',
    tableName: 'UserMappings',
    connection: 'TableStorageConnectionString',
    direction: 'out',
    name: 'tableBindingOut'
});

export async function onAadB2cTokenIssuing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const { client_id, object_id } = await request.json() as Record<string, string>;

    if (!client_id || !object_id) {
        return {
            status: 400
        };
    }

    const PartitionKey = `${client_id}_${object_id}`;
    const RowKey = object_id;

    const rows = context.extraInputs.get(tableInput) as TableRow[];

    if (rows.length > 1) {
        console.log("Found more than user entry!");
    }

    var AcsUserId = rows.find(x => x.PartitionKey === PartitionKey && x.RowKey === RowKey)?.AcsUserId;

    if (!AcsUserId) {
        AcsUserId = await createAcsUser();

        context.extraOutputs.set(tableOutput, {
            PartitionKey,
            RowKey,
            AcsUserId
        });
    }

    return {
        jsonBody: {
            version: '1.0.0',
            action: 'continue',
            extension_acsUserId: AcsUserId
        }
    };
};

const createAcsUser = async(): Promise<string> => {
    return btoa(Math.random().toString().substring(2, 5));
};

app.http('onAadB2cTokenIssuing', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    extraInputs: [tableInput],
    extraOutputs: [tableOutput],
    handler: onAadB2cTokenIssuing
});
