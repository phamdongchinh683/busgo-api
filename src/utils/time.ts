import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export const getNow = () => {
    return dayjs().utc()
}

export const getNext = (params: { second: number }) => {
    return getNow().add(params.second, 'seconds').toDate()
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
