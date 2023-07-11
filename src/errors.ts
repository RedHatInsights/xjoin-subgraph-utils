export class XJoinSubgraphUtilsError extends Error {
    cause: Error|unknown

    constructor(message: string, cause?: Error|unknown) {
        super(message);
        this.name = 'XJoinSubgraphUtilsError';
        this.cause = cause;
        Error.captureStackTrace(this, XJoinSubgraphUtilsError);
    }
}