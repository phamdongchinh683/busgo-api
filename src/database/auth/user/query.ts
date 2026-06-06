import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../user/type.js'

export function getOne(params: {
  email?: string
  phone?: string
  id?: AuthUserId
}) {
  const { email, phone, id } = params
  return db
    .selectFrom('auth.user as u')
    .selectAll()
    .where(eb => {
      const cond = []
      if (email) cond.push(eb('u.email', '=', email))
      if (phone) cond.push(eb('u.phone', '=', phone))
      if (id) cond.push(eb('u.id', '=', id))
      return eb.and(cond)
    })
    .executeTakeFirstOrThrow()
}
