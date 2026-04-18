import { dal } from '../../index.js'
import { TripSeatParam } from '../../../model/params/trip/index.js'

export async function findAll(params: TripSeatParam) {
    return dal.organization.seat.query.getAvailableSeats(params)
}
