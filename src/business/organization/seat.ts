import { dal } from '../../database/index.js'
import { OrganizationVehicleId } from '../../database/organization/vehicle/type.js'
import { SeatCreateBody } from '../../model/body/seat/index.js'
import { TripSeatParam } from '../../model/params/trip/index.js'
import { HttpErr } from '../../app/index.js'

export async function getSeats(params: TripSeatParam) {
    return {
        seats: await dal.organization.seat.cmd.findAll(params),
    }
}

export async function createSeat(body: SeatCreateBody) {
    const seats = await dal.organization.seat.cmd.getSeatsByVehicle(body.vehicleId)
    if (seats.length > 0) {
        throw new HttpErr.UnprocessableEntity('Xe này đã được cấu hình ghế.')
    }

    await dal.organization.seat.query.createOne(body)

    return {
        message: 'Thành công',
    }
}

export async function deleteSeat(vehicleId: OrganizationVehicleId) {
    await dal.organization.seat.query.deleteByVehicleId(vehicleId)

    return {
        message: 'Thành công',
    }
}
