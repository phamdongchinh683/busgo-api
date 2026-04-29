import cron from 'node-cron'
import { bus } from '../../business/index.js'

export function cleanupTripWeekly() {
    cron.schedule(
        '0 7 * * 0,6',
        async () => {
            try {
                await bus.operation.trip.cleanupTrips()
            } catch (err) {
                console.error(err)
            }
        },
        {
            timezone: 'Asia/Ho_Chi_Minh',
        }
    )
}
