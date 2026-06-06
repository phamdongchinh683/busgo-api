export class BadRequest extends Error {
    constructor(
        public message = 'Invalid request.',
        public errorCode = 'BadRequest',
        public extra: object = {},
        public status = 400
    ) {
        super()
    }
}

export class Forbidden extends Error {
    constructor(
        public message = 'You do not have permission to perform this action.',
        public extra: object = {},
        public errorCode = 'Forbidden',
        public status = 403
    ) {
        super()
    }
}

export class NotFound extends Error {
    constructor(
        public message = 'Resource not found.',
        public extra: object = {},
        public errorCode = 'NotFound',
        public status = 404
    ) {
        super()
    }
}

export class Unauthorized extends Error {
    constructor(
        public message = 'You are not authenticated or the login session is invalid.',
        public extra: object = {},
        public errorCode = 'Unauthorized',
        public status = 401
    ) {
        super()
    }
}

export class UnprocessableEntity extends Error {
    constructor(
        public message = 'Invalid data.',
        public errorCode = 'UnprocessableEntity',
        public extra: object = {},
        public status = 422
    ) {
        super()
    }
}

export class TooManyRequests extends Error {
    constructor(
        public message = 'You have sent too many requests.',
        public errorCode = 'TooManyRequests',
        public extra: object = {},
        public status = 429
    ) {
        super()
    }
}
