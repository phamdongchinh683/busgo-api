import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export const getNow = () => {
    return dayjs().tz('Asia/Ho_Chi_Minh')
}

export const getNext = (params: { milliseconds: number }) => {
    return getNow().add(params.milliseconds, 'milliseconds').toDate()
}

export const coolDownTime = 60 * 10 * 1000

export const buildAppTransId = (transactionCode: string) => {
    return `${getNow().format('YYMMDD')}_${transactionCode}`
}

export const getPeriodStartAndEnd = (year: number) => {
    return {
        start: dayjs().year(year).startOf('year').toDate(),
        end: dayjs().year(year).endOf('year').toDate(),
    }
}

/** For the selected calendar year: past years show all 12 months; current year stops at today’s month (Asia/Ho_Chi_Minh). */
export const getMaxMonthInclusiveForPeriodYear = (year: number) => {
    const now = getNow()
    if (year < now.year()) return 12
    if (year > now.year()) return 12
    return now.month() + 1
}

/** Twelve entries for months 1–12; months absent from `rows` use value 0. */
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
