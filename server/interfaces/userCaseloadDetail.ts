export interface UserCaseloadDetail {
  username: string
  active: boolean
  accountType: string
  activeCaseload?: IdNamePair
  caseloads: IdNamePair[]
}

interface IdNamePair {
  id: string
  name: string
}