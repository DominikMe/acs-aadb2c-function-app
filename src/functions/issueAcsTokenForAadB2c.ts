import { app, HttpRequest, HttpResponseInit, InvocationContext, input, output } from "@azure/functions";
import { verifyAadB2cToken } from "../auth/b2cToken";

export async function issueAcsTokenForAadB2c(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return { status: 401 };
    }

    const token = authHeader.substring("Bearer ".length);
    var { success, payload } = await verifyAadB2cToken(token);

    if (!success) {
        return { status: 401 };
    }

    const acsUserId = payload['extension_acsUserId'] as string;
    const acsUserToken = await getAcsUserToken(acsUserId, payload.exp);

    return {
        jsonBody: {
            acsUserId,
            acsUserToken
        }
    };
};

const getAcsUserToken = async (acsUserId: string, exp: number): Promise<string> => {
    return "token";
};

app.http('issueAcsTokenForAadB2c', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: issueAcsTokenForAadB2c
});
