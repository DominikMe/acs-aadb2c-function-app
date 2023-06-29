
import { InvocationContext } from "@azure/functions";
import { JWTPayload, createRemoteJWKSet, jwtVerify } from "jose";

const verifyOptions = {
    issuer: process.env.OpenIdTokenIssuer,
    audience: process.env.OpenIdTokenAudience
};

const jwksUrl = new URL(process.env.OpenIdJwksUrl);

export const verifyAadB2cToken = async (token: string, context: InvocationContext): Promise<{ success: boolean, payload: JWTPayload}> => {
    try {
        const keys = await createRemoteJWKSet(jwksUrl);
        const result = await jwtVerify(token, keys, verifyOptions);
        return { success: true, payload: result.payload };
    }
    catch (e) {
        context.log(e);
        return { success: false, payload: null };
    }
}; 
