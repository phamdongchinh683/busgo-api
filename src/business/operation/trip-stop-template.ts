import { OperationTripScheduleId } from '../../database/operation/trip-schedule/type.js'
import { dal } from '../../database/index.js'
import {
    OperationTripStopTemplateTableInsert,
    OperationTripStopTemplateTableUpdate,
} from '../../database/operation/trip-stop-template/table.js'
import { OperationTripStopTemplateId } from '../../database/operation/trip-stop-template/type.js'
import { UserInfo } from '../../model/common.js'
import { OperationRouteId } from '../../database/operation/route/type.js'
import { utils } from '../../utils/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { OperationStationId } from '../../database/operation/station/type.js'
import { HttpErr } from '../../app/index.js'

export async function getStoppingPoints(params: {
    scheduleId: OperationTripScheduleId
    routeId?: OperationRouteId
    companyId: OrganizationBusCompanyId
}) {
    return {
        stoppingPoints:
            await dal.operation.tripStopTemplate.query.getStoppingPointByScheduleId(params),
    }
}

export async function updateStoppingPointById(
    id: OperationTripStopTemplateId,
    body: OperationTripStopTemplateTableUpdate & { companyId: OrganizationBusCompanyId }
) {
    await assertCompanyResources(body)
    const stoppingPoint = await dal.operation.tripStopTemplate.query.updateOneById(id, body)

    if (stoppingPoint.scheduleId) {
        await utils.cache.delCache(`trip-schedule:pickup-stops:${stoppingPoint.scheduleId}`)
    }

    return {
        stoppingPoint: await dal.operation.tripStopTemplate.query.getPublicById(id),
    }
}

export async function createStoppingPoint(params: {
    body: OperationTripStopTemplateTableInsert
    user: UserInfo
}) {
    const data = {
        ...params.body,
        companyId: params.user.companyId,
    } as OperationTripStopTemplateTableInsert

    await assertCompanyResources(data)
    const stoppingPoint = await dal.operation.tripStopTemplate.cmd.createOne(data)

    await utils.cache.delCache(`trip-schedule:pickup-stops:${data.scheduleId}`)

    return {
        stoppingPoint: await dal.operation.tripStopTemplate.query.getPublicById(
            stoppingPoint.internalId
        ),
    }
}

async function assertCompanyResources(params: {
    companyId: OrganizationBusCompanyId
    scheduleId?: OperationTripScheduleId
    stationId?: OperationStationId
    routeId?: OperationRouteId
}) {
    const [schedule, station] = await Promise.all([
        params.scheduleId ? dal.operation.tripSchedule.cmd.findById(params.scheduleId) : undefined,
        params.stationId
            ? dal.operation.station.query.findById(params.stationId, params.companyId)
            : undefined,
    ])

    if (
        (schedule &&
            (schedule.companyId !== params.companyId ||
                (params.routeId !== undefined && schedule.routeId !== params.routeId))) ||
        (params.stationId && !station)
    ) {
        throw new HttpErr.Forbidden('Lịch trình hoặc trạm dừng không thuộc công ty của bạn.')
    }
}
