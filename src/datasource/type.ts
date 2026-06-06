import { AuthUserTable } from '../database/auth/user/table.js'

export interface Database {
  'auth.user': AuthUserTable
}
