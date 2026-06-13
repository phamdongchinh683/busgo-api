import { ContactInfo } from '../model/common.js'

export function parseContactInfo(contactInfo: ContactInfo) {
    return {
        email: contactInfo.email,
        phone: contactInfo.phone,
    }
}

export function paginateByCursor<T extends { id: number | string }>(items: T[], limit = 10) {
    const hasNextPage = items.length > limit
    const page = hasNextPage ? items.slice(0, limit) : items
    const last = page[page.length - 1]
    const next = hasNextPage ? (last?.id ?? null) : null

    return {
        data: page,
        next,
    }
}
