import { CaseLoad } from './caseLoad'
import { StaffRole } from '../@types/StaffRole'
import { Location } from './location'

export interface UserData {
  caseLoads: CaseLoad[]
  activeCaseLoad: CaseLoad | null
  staffRoles: StaffRole[]
  locations: Location[]
}
