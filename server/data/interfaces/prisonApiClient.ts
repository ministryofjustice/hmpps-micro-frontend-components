import { CaseLoad } from '../../interfaces/caseLoad'

export interface PrisonApiClient {
  getUserCaseLoads(): Promise<CaseLoad[]>
}
