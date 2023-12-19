// eslint-disable-next-line no-shadow
export enum ServiceName {
  ADJUDICATION = 'adjudications',
  ACTIVITIES = 'activities',
}

export interface ServiceActiveAgencies {
  app: ServiceName
  activeAgencies: string[]
}
