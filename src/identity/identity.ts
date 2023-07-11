import {HttpErrorBadRequest, HttpErrorForbidden, HttpErrorUnauthorized} from "./errors";
import {Logger} from "../logging";
import {Request, Response, NextFunction} from 'express';

export const IDENTITY_HEADER = 'x-rh-identity';

export function identity(req: Request, res: Response, next: NextFunction): void {
    const raw = req.header(IDENTITY_HEADER);

    if (raw === undefined) {
        Logger.info('rejecting request due to missing identity header');
        return next(new HttpErrorUnauthorized());
    }

    try {
        const value = Buffer.from(raw, 'base64').toString('utf8');
        const identity = JSON.parse(value).identity;

        req.org_id = identity.org_id;
        if (req.org_id === "") {
            Logger.info('rejecting request for undefined "org_id"');
            return next(new HttpErrorBadRequest());
        }

        if (identity.type !== 'User' && identity.type !== 'System') {
            Logger.info('rejecting request for identity.type: ' + identity.type);
            return next(new HttpErrorForbidden());
        }

        if (identity.type === 'User') {
            req.username = identity.user?.username;
            req.is_internal = identity.user?.is_internal;
        }

        next();
    } catch (e: any) {
        Logger.error(e);
        return next(new HttpErrorBadRequest());
    }
}