import { sql } from 'kysely'

import { db } from '../../../datasource/db.js'
import { OperationTripId } from '../../operation/trip/type.js'
import { OrganizationVehicleId } from '../vehicle/type.js'
import { OrganizationSeatTableInsert } from './table.js'
import { SeatCreateBody } from '../../../model/body/seat/index.js'
import { OrganizationSeatType } from './type.js'
import type { TripSeatParam } from '../../../model/params/trip/index.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

function generateSeatLabels(floors: number, rowsPerFloor: number): Array<{ seatNumber: string; type: OrganizationSeatType }> {
    const labels: Array<{ seatNumber: string; type: OrganizationSeatType }> = []
    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    
    for (let floor = 1; floor <= floors; floor++) {
        const floorType = floor as OrganizationSeatType
        for (let row = 0; row < rowsPerFloor; row++) {
            const rowLetter = rowLabels[row]
            labels.push({
                seatNumber: `${rowLetter}${floor}`,
                type: floorType,
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

export async function getSeatsWithAvailability(params: TripSeatParam) {
    const tripId = (params as any).id
    const { stopOrderPickup, stopOrderDropoff } = params

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
                            .where('t.id', '=', tripId)
                            .where('fromStop.stopOrder', '<', stopOrderDropoff)
                            .where('toStop.stopOrder', '>', stopOrderPickup)
                    )
                )
                .$castTo<boolean>()
                .as('isAvailable'),
        ])
        .where('s.vehicleId', '=', eb =>
            eb.selectFrom('operation.trip').select('vehicleId').where('id', '=', tripId)
        )
        .orderBy('s.type', 'asc')
        .orderBy(sql<number>`regexp_replace(s.seat_number, '\\D', '', 'g')::int`, 'asc')
        .orderBy('s.seatNumber')
        .execute()
}

export async function getSeatsWithAvailabilityByTripId(
    tripId: OperationTripId,
    stopOrderPickup: number,
    stopOrderDropoff: number
) {
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
                            .where('ss.tripId', '=', tripId)
                            .where('fromStop.stopOrder', '<', stopOrderDropoff)
                            .where('toStop.stopOrder', '>', stopOrderPickup)
                    )
                )
                .$castTo<boolean>()
                .as('isAvailable'),
        ])
        .where('s.vehicleId', '=', eb =>
            eb.selectFrom('operation.trip').select('vehicleId').where('id', '=', tripId)
        )
        .orderBy('s.type', 'asc')
        .orderBy(sql<number>`regexp_replace(s.seat_number, '\\D', '', 'g')::int`, 'asc')
        .orderBy('s.seatNumber')
        .execute()
}

export async function createOne(body: SeatCreateBody) {
    const { vehicleId, floors, rowsPerFloor } = body
    const labels = generateSeatLabels(floors, rowsPerFloor)
    const values: OrganizationSeatTableInsert[] = labels.map(({ seatNumber, type }) => ({
        vehicleId,
        seatNumber,
        type,
    }))
    return db.insertInto('organization.seat').values(values).returningAll().execute()
}

export async function deleteByVehicleId(
    vehicleId: OrganizationVehicleId,
    companyId: OrganizationBusCompanyId
) {
    return db
        .deleteFrom('organization.seat as s')
        .where('s.vehicleId', '=', vehicleId)
        .where(eb =>
            eb.exists(
                eb
                    .selectFrom('organization.vehicle as v')
                    .select('v.id')
                    .whereRef('v.id', '=', 's.vehicleId')
                    .where('v.companyId', '=', companyId)
            )
        )
        .executeTakeFirstOrThrow()
}
