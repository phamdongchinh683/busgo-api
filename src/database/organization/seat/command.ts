import { dal } from '../../index.js'
import { TripSeatParam } from '../../../model/params/trip/index.js'
import { OrganizationVehicleId } from '../vehicle/type.js'
import { OperationTripId } from '../../operation/trip/type.js'

export async function findAll(params: TripSeatParam) {
    return dal.organization.seat.query.getSeatsWithAvailability(params)
}

export async function findAllByTripId(params: {
    tripId: OperationTripId
    stopOrderPickup: number
    stopOrderDropoff: number
}) {
    return dal.organization.seat.query.getSeatsWithAvailabilityByTripId(
        params.tripId,
        params.stopOrderPickup,
        params.stopOrderDropoff
    )
}

export async function getSeatsByVehicle(vehicleId: OrganizationVehicleId) {
    return dal.organization.seat.query.getSeatsByVehicle(vehicleId)
}
