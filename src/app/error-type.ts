export class BadRequest extends Error {
    constructor(
        public message = 'Yêu cầu không hợp lệ.',
        public errorCode = 'BadRequest',
        public extra: object = {},
        public status = 400
    ) {
        super()
    }
}

export class Forbidden extends Error {
    constructor(
        public message = 'Bạn không có quyền thực hiện thao tác này.',
        public extra: object = {},
        public errorCode = 'Forbidden',
        public status = 403
    ) {
        super()
    }
}

export class NotFound extends Error {
    constructor(
        public message = 'Không tìm thấy tài nguyên.',
        public extra: object = {},
        public errorCode = 'NotFound',
        public status = 404
    ) {
        super()
    }
}

export class Unauthorized extends Error {
    constructor(
        public message = 'Bạn chưa được xác thực hoặc phiên đăng nhập không hợp lệ.',
        public extra: object = {},
        public errorCode = 'Unauthorized',
        public status = 401
    ) {
        super()
    }
}

export class UnprocessableEntity extends Error {
    constructor(
        public message = 'Dữ liệu không hợp lệ.',
        public errorCode = 'UnprocessableEntity',
        public extra: object = {},
        public status = 422
    ) {
        super()
    }
}

export class TooManyRequests extends Error {
    constructor(
        public message = 'Bạn đã gửi quá nhiều yêu cầu.',
        public errorCode = 'TooManyRequests',
        public extra: object = {},
        public status = 429
    ) {
        super()
    }
}
