import { db } from '../../../datasource/db.js'
import { TripSeatParam } from '../../../model/params/trip/index.js'
import { OperationTripId } from '../../operation/trip/type.js'
import { OrganizationVehicleId } from '../vehicle/type.js'
import { OrganizationSeatTableInsert } from './table.js'
import { SeatCreateBody } from '../../../model/body/seat/index.js'

// 24 seats: row A 1->12 (1A..12A), row B 1->12 (1B..12B). 36 seats: row A 1->18 (1A..18A), row B 1->18 (1B..18B).
function seatLabels(count: 24 | 36): string[] {
    const perRow = count === 24 ? 12 : 18
    const rows = ['A', 'B'] as const
    const labels: string[] = []
    for (const row of rows) {
        for (let n = 1; n <= perRow; n++) labels.push(`${n}${row}`)
    }
    return labels
}

export function getSeatsByVehicle(vehicleId: OrganizationVehicleId) {
    return db
        .selectFrom('organization.seat as s')
        .where('s.vehicleId', '=', vehicleId)
        .select(['s.id', 's.seatNumber'])
}

function getOccupiedSeatsSubQuery(params: TripSeatParam) {
    const { id, pickup, dropoff } = params
    return db
        .selectFrom('booking.seat_segment as ss')
        .innerJoin('operation.trip as t', 't.id', 'ss.tripId')
        .innerJoin('operation.trip_stop_template as ts', join =>
            join
                .onRef('ts.scheduleId', '=', 't.scheduleId')
                .onRef('ts.stationId', '=', 'ss.fromStationId')
        )
        .innerJoin('operation.trip_stop_template as fs', join =>
            join
                .onRef('fs.scheduleId', '=', 't.scheduleId')
                .onRef('fs.stationId', '=', 'ss.toStationId')
        )
        .where(eb => {
            const cond = []
            cond.push(eb('ss.tripId', '=', id))
            cond.push(eb('ts.stopOrder', '<', dropoff))
            cond.push(eb('fs.stopOrder', '>', pickup))
            return eb.and(cond)
        })
        .select(['ss.seatId'])
}

function getVehicleIdByTrip(tripId: OperationTripId) {
    return db
        .selectFrom('operation.trip')
        .select('vehicleId')
        .where('id', '=', tripId)
        .executeTakeFirstOrThrow()
}

export async function getAvailableSeats(params: TripSeatParam) {
    const { vehicleId } = await getVehicleIdByTrip(params.id)

    return db
        .selectFrom('organization.seat as s')
        .select(['s.id', 's.seatNumber'])
        .where(eb => {
            const cond = []
            cond.push(eb('s.vehicleId', '=', vehicleId))
            cond.push(eb('s.id', 'not in', getOccupiedSeatsSubQuery(params)))
            return eb.and(cond)
        })
        .orderBy('s.seatNumber')
        .execute()
}

export async function createOne(body: SeatCreateBody) {
    const { vehicleId, seatCount } = body
    const count = Number(seatCount) as 24 | 36
    const labels = seatLabels(count)
    const values: OrganizationSeatTableInsert[] = labels.map(seatNumber => ({
        vehicleId,
        seatNumber,
    }))
    return db.insertInto('organization.seat').values(values).returningAll().execute()
}

export async function deleteByVehicleId(vehicleId: OrganizationVehicleId) {
    return db
        .deleteFrom('organization.seat')
        .where('vehicleId', '=', vehicleId)
        .executeTakeFirstOrThrow()
}
