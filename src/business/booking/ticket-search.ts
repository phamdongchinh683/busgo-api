import { BookingTicketStatus } from '../../database/booking/ticket/type.js'
import { BookingType } from '../../database/booking/booking/type.js'
import { TicketFilter } from '../../model/query/ticket/index.js'

export function applyTicketNaturalLanguageFilter<T extends TicketFilter>(q: T): T {
    if (!q.search) {
        return q
    }

    const parsed = parseTicketSearch(q.search)

    return {
        ...q,
        status: q.status ?? parsed.status,
        type: q.type ?? parsed.type,
    } as T
}

function parseTicketSearch(search: string): Partial<Pick<TicketFilter, 'status' | 'type'>> {
    const normalized = normalizeSearch(search)

    return {
        status: parseTicketStatus(normalized),
        type: parseBookingType(normalized),
    }
}

function parseTicketStatus(search: string): BookingTicketStatus | undefined {
    if (containsAny(search, ['da huy', 'bi huy', 'huy ve', 'cancelled', 'canceled', 'cancel'])) {
        return BookingTicketStatus.enum.cancelled
    }

    if (
        containsAny(search, [
            'da check in',
            'check in',
            'checked in',
            'da len xe',
            'len xe',
            'da di',
            'da di roi',
        ])
    ) {
        return BookingTicketStatus.enum.checked_in
    }

    if (
        containsAny(search, [
            'da thanh toan',
            'thanh toan roi',
            'thanh toan thanh cong',
            'da tra tien',
            'tra tien roi',
            'xong tien',
            'hoan tat thanh toan',
            'paid',
        ])
    ) {
        return BookingTicketStatus.enum.paid
    }

    if (
        containsAny(search, [
            'giu cho',
            'dang giu',
            'cho thanh toan',
            'chua thanh toan',
            'cho tra tien',
            'chua tra tien',
            'dang cho',
            'dat cho',
            'giu ve',
            'reserved',
        ])
    ) {
        return BookingTicketStatus.enum.reserved
    }
}

function parseBookingType(search: string): BookingType | undefined {
    if (
        containsAny(search, [
            'khu hoi',
            've ve',
            'luot ve',
            '2 chieu',
            'hai chieu',
            'di ve',
            'round trip',
            'round-trip',
        ])
    ) {
        return BookingType.enum.round_trip
    }

    if (
        containsAny(search, [
            'mot chieu',
            '1 chieu',
            'luot di',
            'chieu di',
            've di',
            'one way',
            'one-way',
        ])
    ) {
        return BookingType.enum.one_way
    }
}

function containsAny(value: string, patterns: string[]) {
    return patterns.some(pattern => value.includes(normalizeSearch(pattern)))
}

function normalizeSearch(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}
