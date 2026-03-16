import expireBooking from './expire-booking/index.js'
import { db } from '../datasource/db.js'

export function startJobs() {
    console.log({ message: '--------- Started cron jobs ---------' })
    expireBooking(db)
}
