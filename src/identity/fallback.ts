import {IDENTITY_HEADER} from "./identity.js";
import {createIdentityHeader} from "./utils.js";
import express from "express";

export function identityFallback(req: express.Request, res: express.Response, next: express.NextFunction): void {
    if (req.header(IDENTITY_HEADER) === undefined) {
        req.headers[IDENTITY_HEADER] = createIdentityHeader(); // eslint-disable-line security/detect-object-injection
    }

    next();
}
