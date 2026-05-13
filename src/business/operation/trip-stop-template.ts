import { OperationTripScheduleId } from '../../database/operation/trip-schedule/type.js'
import { dal } from '../../database/index.js'
import {
    OperationTripStopTemplateTableInsert,
    OperationTripStopTemplateTableUpdate,
} from '../../database/operation/trip-stop-template/table.js'
import { OperationTripStopTemplateId } from '../../database/operation/trip-stop-template/type.js'
import { UserInfo } from '../../model/common.js'
import { OperationRouteId } from '../../database/operation/route/type.js'

export async function getStoppingPoints(params: {
    scheduleId: OperationTripScheduleId
    routeId?: OperationRouteId
}) {
    return {
        stoppingPoints:
            await dal.operation.tripStopTemplate.query.getStoppingPointByScheduleId(params),
    }
}

export async function updateStoppingPointById(
    id: OperationTripStopTemplateId,
    body: OperationTripStopTemplateTableUpdate
) {
    return {
        stoppingPoint: await dal.operation.tripStopTemplate.query.updateOneById(id, body),
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

    return {
        stoppingPoint: await dal.operation.tripStopTemplate.cmd.createOne(data),
    }
}
