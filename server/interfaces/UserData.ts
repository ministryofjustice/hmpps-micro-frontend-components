import { CaseLoad } from './caseLoad'
import { Service } from './Service'

export interface UserData {
  caseLoads: CaseLoad[]
  activeCaseLoad: CaseLoad | null
  services: Service[]
}
