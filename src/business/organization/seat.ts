import { dal } from '../../database/index.js'
import { OrganizationVehicleId } from '../../database/organization/vehicle/type.js'
import { SeatCreateBody } from '../../model/body/seat/index.js'
import { TripSeatParam } from '../../model/params/trip/index.js'

export async function getSeats(params: TripSeatParam) {
    return {
        seats: await dal.organization.seat.cmd.findAll(params),
    }
}

export async function createSeat(body: SeatCreateBody) {
    await dal.organization.seat.query.createOne(body)

    return {
        message: 'OK',
    }
}

export async function deleteSeat(vehicleId: OrganizationVehicleId) {
    await dal.organization.seat.query.deleteByVehicleId(vehicleId)

    return {
        message: 'OK',
    }
}
