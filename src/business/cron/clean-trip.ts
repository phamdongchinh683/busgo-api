import { bus } from '../../business/index.js'

export async function cleanupTripWeekly() {
    await bus.operation.trip.cleanupTrips()

    return {
        message: 'Thành công',
    }
}
