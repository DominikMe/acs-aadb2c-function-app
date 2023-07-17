import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyAadB2cToken } from "../auth/b2cToken";
import { CommunicationIdentityClient, TokenScope } from "@azure/communication-identity";

export async function issueAcsTokenForAadB2c(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return { status: 401 };
    }

    const token = authHeader.substring("Bearer ".length);
    var { success, payload } = await verifyAadB2cToken(token, context);

    if (!success) {
        return { status: 401 };
    }

    const urlParams = new URLSearchParams(request.query);
    const scopes = urlParams.get("scopes");

    const acsUserId = payload['extension_acs_user_id'] as string;
    const acsUserToken = await getAcsUserToken(acsUserId, scopes, payload.exp);

    return {
        jsonBody: {
            acsUserId,
            acsUserToken
        }
    };
};

const getAcsUserToken = async (acsUserId: string, scopes: string, exp: number): Promise<string> => {
    const identityClient = new CommunicationIdentityClient(process.env.CommunicationConnectionString);
    const expiresIn = new Date(exp * 1000);
    const diff = (+expiresIn - Date.now()) / 1000 / 60;
    const tokenScopes = scopes.split(',') as TokenScope[];
    const { token } = await identityClient.getToken({ communicationUserId: acsUserId }, tokenScopes, {
        tokenExpiresInMinutes: Math.max(60, diff)
    });
    return token;
};

app.http('issueAcsTokenForAadB2c', {
    methods: ['GET'],
    authLevel: 'function',
    handler: issueAcsTokenForAadB2c
});
