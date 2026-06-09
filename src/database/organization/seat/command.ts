import { dal } from '../../index.js'
import { TripSeatParam } from '../../../model/params/trip/index.js'
import { OrganizationVehicleId } from '../vehicle/type.js'

export async function findAll(params: TripSeatParam) {
    return dal.organization.seat.query.getSeatsWithAvailability(params)
}

export async function getSeatsByVehicle(vehicleId: OrganizationVehicleId) {
    return dal.organization.seat.query.getSeatsByVehicle(vehicleId)
}
