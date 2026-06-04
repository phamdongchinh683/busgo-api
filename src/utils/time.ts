import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const APP_TIMEZONE = 'Asia/Ho_Chi_Minh'

export const getNow = () => {
    return dayjs().tz(APP_TIMEZONE)
}

export const getTodayCalendarDateString = () => {
    return getNow().format('YYYY-MM-DD')
}

export const formatCalendarDate = (date: Date, pattern = 'DD/MM/YYYY') => {
    return dayjs(date).tz(APP_TIMEZONE).format(pattern)
}

export const getNext = (params: { milliseconds: number }) => {
    return getNow().add(params.milliseconds, 'milliseconds').toDate()
}

export const coolDownTime = 60 * 10 * 1000

export const buildAppTransId = (transactionCode: string) => {
    return `${getNow().format('YYMMDD')}_${transactionCode}`
}

const REPORT_TZ = 'Asia/Ho_Chi_Minh'

export const getPeriodStartAndEnd = (year: number) => {
    return {
        start: dayjs.tz(`${year}-01-01`, REPORT_TZ).startOf('day').toDate(),
        end: dayjs.tz(`${year}-12-31`, REPORT_TZ).endOf('day').toDate(),
    }
}

export const getMaxMonthInclusiveForPeriodYear = (year: number) => {
    const now = getNow()
    if (year < now.year()) return 12
    if (year > now.year()) return 12
    return now.month() + 1
}

export const normalizeMonthlySeries = (
    rows: ReadonlyArray<readonly [month: number, value: number]>,
    options?: { maxMonthInclusive?: number }
): [number, number][] => {
    const byMonth = new Map(rows.map(([m, v]) => [m, v]))
    const cap = options?.maxMonthInclusive ?? 12
    return Array.from({ length: 12 }, (_, i): [number, number] => {
        const month = i + 1
        const raw = byMonth.get(month) ?? 0
        return [month, month <= cap ? raw : 0]
    })
}

export const isOutsideCancelableWindow = (params: { departureDate: Date; now: Date }) => {
    return dayjs(params.departureDate).diff(dayjs(params.now), 'hour', true) <= 24
}
export const coolDownTime12Hours = 12 * 60 * 60 * 1000
