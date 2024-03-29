export default class HttpError extends Error {
    status: number;
    message: string;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

export class HttpErrorBadRequest extends HttpError {
    constructor(message = 'BadRequest') {
        super(400, message);
    }
}

export class HttpErrorUnauthorized extends HttpError {
    constructor() {
        super(401, 'Unauthorized');
    }
}

export class HttpErrorForbidden extends HttpError {
    constructor() {
        super(403, 'Forbidden');
    }
}
