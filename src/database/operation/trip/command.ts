import { DriverTripQuery, TripFilter } from '../../../model/query/trip/index.js'
import { dal } from '../../index.js'
import { TripBody } from '../../../model/body/trip/index.js'
import { Transaction } from 'kysely'
import { sql } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { OperationTripId, OperationTripStatus } from './type.js'
import { OperationTripTableInsert } from './table.js'
import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../../auth/user/type.js'
import { OperationTripScheduleId } from '../trip-schedule/type.js'
import { HttpErr } from '../../../app/index.js'
import { utils } from '../../../utils/index.js'

export async function getManyByFilter(params: TripFilter) {
    return dal.operation.trip.query.findAllByFilter(params)
}

export async function createTrip(params: OperationTripTableInsert, trx: Transaction<Database>) {
    return trx
        .insertInto('operation.trip')
        .values(params)
        .onConflict(oc =>
            oc.columns(['scheduleId', 'departureDate']).doUpdateSet({
                scheduleId: params.scheduleId,
                departureDate: params.departureDate,
            })
        )
        .returningAll()
        .returning(['id as internalId', 'publicId as id'])
        .executeTakeFirstOrThrow()
}

export async function findByScheduleIdAndDepartureDate(
    params: { scheduleId: OperationTripScheduleId; departureDate: Date },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('operation.trip as t')
        .innerJoin('operation.trip_schedule as ts', 'ts.id', 't.scheduleId')
        .where(eb => {
            const cond = []
            cond.push(eb('t.scheduleId', '=', params.scheduleId))
            cond.push(eb('t.departureDate', '=', params.departureDate))
            return eb.and(cond)
        })
        .select([
            't.id as internalId',
            't.publicId as id',
            't.status',
            't.departureDate',
            'ts.companyId',
            'ts.departureTime',
        ])
        .executeTakeFirst()
}

export async function createTripTransaction({ scheduleId, departureDate, companyId }: TripBody) {
    return db.transaction().execute(async trx => {
        const existingTrip = await findByScheduleIdAndDepartureDate(
            { scheduleId, departureDate },
            trx
        )
        if (existingTrip) {
            assertTripIsBookable({
                status: existingTrip.status,
                departureDate: existingTrip.departureDate,
                departureTime: existingTrip.departureTime,
            })
            return {
                id: existingTrip.id,
                internalId: existingTrip.internalId,
                companyId: existingTrip.companyId,
            }
        }

        const schedule = await dal.operation.tripSchedule.cmd.findByIdAndDate(
            { id: scheduleId, date: departureDate },
            trx
        )
        if (schedule.companyId !== companyId) {
            throw new HttpErr.UnprocessableEntity(
                'Công ty không khớp với lịch trình chuyến đi.',
                'TRIP_SCHEDULE_COMPANY_MISMATCH'
            )
        }
        assertTripIsBookable({
            status: OperationTripStatus.enum.scheduled,
            departureDate,
            departureTime: schedule.departureTime,
        })

        const vehicle = await dal.organization.vehicle.cmd.randomVehicle(schedule.companyId, trx)

        const trip = await createTrip(
            {
                scheduleId: schedule.id,
                departureDate,
                routeId: schedule.routeId,
                vehicleId: vehicle.id,
                status: OperationTripStatus.enum.scheduled,
            },
            trx
        )

        return {
            id: trip.id,
            internalId: trip.internalId,
            companyId: schedule.companyId,
        }
    })
}

function assertTripIsBookable(params: {
    status: OperationTripStatus
    departureDate: Date
    departureTime: string
}) {
    if (params.status !== OperationTripStatus.enum.scheduled) {
        throw new HttpErr.UnprocessableEntity(
            'Chuyến đi đã bắt đầu, hoàn thành nên bạn không thể đặt vé cho ngày hôm nay.',
            'TRIP_NOT_BOOKABLE'
        )
    }

    if (utils.time.isPastDepartureDateTime(params)) {
        throw new HttpErr.UnprocessableEntity(
            'Chuyến đi đã quá giờ khởi hành nên bạn không thể đặt vé cho ngày hôm nay.',
            'TRIP_DEPARTURE_TIME_PASSED'
        )
    }
}

export async function getManyByDriverId(params: DriverTripQuery, userId: AuthUserId) {
    return dal.operation.trip.query.findAllByDriverId(params, userId)
}

export async function updateStatus(
    params: { id: OperationTripId; status: OperationTripStatus; userId: AuthUserId },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('operation.trip')
        .set({
            status: params.status,
            driverIds: sql<AuthUserId[]>`
                CASE
                    WHEN driver_ids IS NULL THEN ARRAY[${params.userId}]::int[]
                    WHEN driver_ids @> ARRAY[${params.userId}]::int[] THEN driver_ids
                    ELSE array_append(driver_ids, ${params.userId})
                END
            `,
        })
        .where('id', '=', params.id)
        .returningAll()
        .returning(['id as internalId', 'publicId as id'])
        .executeTakeFirstOrThrow()
}

export async function updateStatusForResponse(params: {
    id: OperationTripId
    status: OperationTripStatus
    userId: AuthUserId
}) {
    return updateStatus(params)
}

export async function deleteTripsBeforeToday() {
    return db
        .deleteFrom('operation.trip as t')
        .where(sql<boolean>`t.departure_date < CURRENT_DATE`)
        .returning('t.id')
        .executeTakeFirstOrThrow()
}

export async function updateTripAndUpCount(params: {
    id: OperationTripId
    status: OperationTripStatus
    userId: AuthUserId
}) {
    return db.transaction().execute(async trx => {
        await assertTripCanBeCompleted(params, trx)

        const trip = await updateStatus(params, trx)

        if (
            params.status === OperationTripStatus.enum.completed ||
            params.status === OperationTripStatus.enum.cancelled
        ) {
            await dal.organization.driverMonthlyStat.cmd.upsertDriverMonthlyStat(
                {
                    driverId: params.userId,
                    year: trip.departureDate.getFullYear(),
                    month: trip.departureDate.getMonth() + 1,
                    type:
                        params.status === OperationTripStatus.enum.completed
                            ? 'completed'
                            : 'cancelled',
                },
                trx
            )
        }

        return trip
    })
}

async function assertTripCanBeCompleted(
    params: { id: OperationTripId; status: OperationTripStatus },
    trx: Transaction<Database>
) {
    if (params.status !== OperationTripStatus.enum.completed) {
        return
    }

    const uncheckedPassengerCount =
        await dal.booking.ticket.query.countUncheckedActivePassengersByTripId(params.id, trx)

    if (uncheckedPassengerCount > 0) {
        throw new HttpErr.UnprocessableEntity(
            'Vẫn còn hành khách chưa check-in, không thể hoàn thành chuyến.',
            'TRIP_HAS_UNCHECKED_PASSENGERS'
        )
    }
}
