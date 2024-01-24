// eslint-disable-next-line no-shadow
export enum ServiceName {
  ADJUDICATION = 'adjudications',
  ACTIVITIES = 'activities',
  CAS2 = 'cas2',
}

export interface ServiceActiveAgencies {
  app: ServiceName
  activeAgencies: string[]
}
