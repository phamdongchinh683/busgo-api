import { sql } from 'kysely'

import { db } from '../../../datasource/db.js'
import { TripSeatParam } from '../../../model/params/trip/index.js'
import { OperationTripId } from '../../operation/trip/type.js'
import { OrganizationVehicleId } from '../vehicle/type.js'
import { OrganizationSeatTableInsert } from './table.js'
import { SeatCreateBody } from '../../../model/body/seat/index.js'
import { OrganizationSeatType } from './type.js'

type SeatLabel = {
    seatNumber: string
    type: OrganizationSeatType
}

function seatLabels(count: 24 | 36): SeatLabel[] {
    const perFloor = count / 2
    const floors = [
        { suffix: 'A', type: 1 },
        { suffix: 'B', type: 2 },
    ] as const
    const labels: SeatLabel[] = []

    for (const floor of floors) {
        for (let n = 1; n <= perFloor; n++) {
            labels.push({
                seatNumber: `${n}${floor.suffix}`,
                type: floor.type,
            })
        }
    }

    return labels
}

export function getSeatsByVehicle(vehicleId: OrganizationVehicleId) {
    return db
        .selectFrom('organization.seat as s')
        .where('s.vehicleId', '=', vehicleId)
        .select(['s.id', 's.seatNumber', 's.type'])
        .orderBy('s.type', 'asc')
        .orderBy(sql<number>`regexp_replace(s.seat_number, '\\D', '', 'g')::int`, 'asc')
        .orderBy('s.seatNumber', 'asc')
        .execute()
}

function getVehicleIdByTrip(tripId: OperationTripId) {
    return db
        .selectFrom('operation.trip')
        .select('vehicleId')
        .where('id', '=', tripId)
        .executeTakeFirstOrThrow()
}

export async function getSeatsWithAvailability(params: TripSeatParam) {
    const { vehicleId } = await getVehicleIdByTrip(params.id)

    return db
        .selectFrom('organization.seat as s')
        .select(eb => [
            's.id',
            's.seatNumber',
            's.type',
            eb
                .not(
                    eb.exists(
                        eb
                            .selectFrom('booking.seat_segment as ss')
                            .innerJoin('operation.trip as t', 't.id', 'ss.tripId')
                            .innerJoin('operation.trip_stop_template as fromStop', join =>
                                join
                                    .onRef('fromStop.scheduleId', '=', 't.scheduleId')
                                    .onRef('fromStop.stationId', '=', 'ss.fromStationId')
                            )
                            .innerJoin('operation.trip_stop_template as toStop', join =>
                                join
                                    .onRef('toStop.scheduleId', '=', 't.scheduleId')
                                    .onRef('toStop.stationId', '=', 'ss.toStationId')
                            )
                            .select('ss.id')
                            .whereRef('ss.seatId', '=', 's.id')
                            .where('ss.tripId', '=', params.id)
                            .where('fromStop.stopOrder', '<', params.stopOrderDropoff)
                            .where('toStop.stopOrder', '>', params.stopOrderPickup)
                    )
                )
                .$castTo<boolean>()
                .as('isAvailable'),
        ])
        .where('s.vehicleId', '=', vehicleId)
        .orderBy('s.type', 'asc')
        .orderBy(sql<number>`regexp_replace(s.seat_number, '\\D', '', 'g')::int`, 'asc')
        .orderBy('s.seatNumber')
        .execute()
}

export async function createOne(body: SeatCreateBody) {
    const { vehicleId, seatCount } = body
    const count = Number(seatCount) as 24 | 36
    const labels = seatLabels(count)
    const values: OrganizationSeatTableInsert[] = labels.map(({ seatNumber, type }) => ({
        vehicleId,
        seatNumber,
        type,
    }))
    return db.insertInto('organization.seat').values(values).returningAll().execute()
}

export async function deleteByVehicleId(vehicleId: OrganizationVehicleId) {
    return db
        .deleteFrom('organization.seat')
        .where('vehicleId', '=', vehicleId)
        .executeTakeFirstOrThrow()
}
