import z from 'zod'

const PROVINCE_API_URL = 'https://provinces.open-api.vn/api/v2/'
const PROVINCE_API_TIMEOUT_MS = 3000

const ProvinceApiResponse = z.array(
    z.object({
        name: z.string(),
        code: z.number(),
        division_type: z.string(),
        codename: z.string(),
    })
)

export async function getProvinceNames(): Promise<string[]> {
    const response = await fetch(PROVINCE_API_URL, {
        signal: AbortSignal.timeout(PROVINCE_API_TIMEOUT_MS),
    })

    if (!response.ok) {
        throw new Error(`Province API request failed with status ${response.status}.`)
    }

    const result = ProvinceApiResponse.safeParse(await response.json())
    if (!result.success) {
        throw new Error('Province API returned an invalid response.')
    }

    return result.data.map(province => province.name)
}
