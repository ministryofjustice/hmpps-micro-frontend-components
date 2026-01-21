type CaseloadFunction = 'GENERAL' | 'ADMIN'

export interface PrisonCaseload {
  id: string
  name: string
  function: CaseloadFunction
}

export interface UserCaseloadDetail {
  username: string
  active: boolean
  accountType: string
  activeCaseload?: PrisonCaseload
  caseloads: PrisonCaseload[]
}
