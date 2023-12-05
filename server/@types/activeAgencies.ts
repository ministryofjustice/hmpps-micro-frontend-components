// eslint-disable-next-line no-shadow
export enum ServiceName {
  ADJUDICATION = 'adjudications',
  ACTIVITIES = 'activities',
  APPOINTMENTS = 'appointments',
}

export interface ServiceActiveAgencies {
  app: ServiceName
  activeAgencies: string[]
}
