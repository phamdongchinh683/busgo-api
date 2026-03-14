import expireBooking from './expire-booking/index.js'
import { db } from '../datasource/db.js'

export function startJobs() {
    console.log('--------- Started cron jobs ---------')
    expireBooking(db)
}
