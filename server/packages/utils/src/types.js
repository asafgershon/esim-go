"use strict";
// Common types used across the eSIM Go project
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = void 0;
// HTTP Status codes for error handling
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    RATE_LIMITED: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
