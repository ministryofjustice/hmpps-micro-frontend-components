export interface CaseLoad {
  caseLoadId: string
  description: string
  type: string
  caseloadFunction: 'GENERAL' | 'ADMIN'
  currentlyActive: boolean
}
