import { db } from '../datasource/db.js'
import { job } from '../job/index.js'

async function main() {
    console.log({ message: 'Start cron jobs' })
    job.booking.expireBooking(db)
    job.customer.notificationDepatureDate(db)
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
