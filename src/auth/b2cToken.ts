
import { JWTPayload, createRemoteJWKSet, jwtVerify } from "jose";

const verifyOptions = {
    issuer: "https://acsaadb2c.b2clogin.com/09b77cb4-728e-4e5b-a2f3-ecae780fa67f/v2.0/",
    audience: "5f521033-b8ed-4097-9f87-91a1c6e43411"
};

const jwksUrl = new URL("https://acsaadb2c.b2clogin.com/acsaadb2c.onmicrosoft.com/b2c_1_signupsignin1/discovery/v2.0/keys");

export const verifyAadB2cToken = async (token: string): Promise<{ success: boolean, payload: JWTPayload}> => {
    try {
        const keys = await createRemoteJWKSet(jwksUrl);
        const result = await jwtVerify(token, keys, verifyOptions);
        return { success: true, payload: result.payload };
    }
    catch (e) {
        console.log(e);
        return { success: false, payload: null };
    }
}; 
