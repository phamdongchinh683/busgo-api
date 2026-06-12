import { dal } from '../../database/index.js'
import { OrganizationVehicleId } from '../../database/organization/vehicle/type.js'
import { OperationTripId } from '../../database/operation/trip/type.js'
import { SeatCreateBody } from '../../model/body/seat/index.js'
import { TripSeatParam } from '../../model/params/trip/index.js'
import { HttpErr } from '../../app/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'

export async function getSeats(params: TripSeatParam) {
    return {
        seats: await dal.organization.seat.cmd.findAll(params),
    }
}

export async function getSeatsByTripId(
    tripId: OperationTripId,
    stopOrderPickup: number,
    stopOrderDropoff: number
) {
    return {
        seats: await dal.organization.seat.cmd.findAllByTripId({
            tripId,
            stopOrderPickup,
            stopOrderDropoff,
        }),
    }
}

export async function createSeat(body: SeatCreateBody, companyId: OrganizationBusCompanyId) {
    await dal.organization.vehicle.cmd.findById(body.vehicleId, companyId)
    const seats = await dal.organization.seat.cmd.getSeatsByVehicle(body.vehicleId)
    if (seats.length > 0) {
        throw new HttpErr.UnprocessableEntity('Xe này đã được cấu hình ghế.')
    }

    await dal.organization.seat.query.createOne(body)

    return {
        message: 'Thành công',
    }
}

export async function deleteSeat(
    vehicleId: OrganizationVehicleId,
    companyId: OrganizationBusCompanyId
) {
    await dal.organization.vehicle.cmd.findById(vehicleId, companyId)
    await dal.organization.seat.query.deleteByVehicleId(vehicleId, companyId)

    return {
        message: 'Thành công',
    }
}
