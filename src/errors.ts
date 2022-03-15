export class XJoinSubgraphUtilsError extends Error {
    cause: Error

    constructor(message, cause?) {
        super(message);
        this.name = 'XJoinSubgraphUtilsError';
        this.cause = cause;
        Error.captureStackTrace(this, XJoinSubgraphUtilsError);
    }
}