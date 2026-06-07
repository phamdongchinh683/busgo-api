const LOCATION_ALIAS_KEYS = new Map<string, string>([
    ['bmt', 'daklak'],
    ['buonmathuot', 'daklak'],
    ['daclac', 'daklak'],
    ['daclak', 'daklak'],
    ['dn', 'danang'],
    ['hcm', 'hochiminh'],
    ['hochiminhcity', 'hochiminh'],
    ['saigon', 'hochiminh'],
    ['sg', 'hochiminh'],
    ['tphcm', 'hochiminh'],
])

export function resolveLatestVietnamLocationName(
    input: string,
    provinceNames: string[]
): string | undefined {
    return findVietnamLocationName(input, provinceNames)
}

function findVietnamLocationName(input: string, candidates: string[]): string | undefined {
    const inputKey = getLocationKey(input)
    return candidates.find(candidate => getLocationKey(candidate) === inputKey)
}

function getLocationKey(value: string): string {
    const rawKey = getRawLocationKey(value)
    return LOCATION_ALIAS_KEYS.get(rawKey) ?? rawKey
}

function getRawLocationKey(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/^(?:tinh|thanh pho|tp)\s+/, '')
        .replace(/\s+/g, '')
}
