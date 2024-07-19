// eslint-disable-next-line no-shadow
export enum ServiceName {
  ADJUDICATION = 'adjudications',
  ACTIVITIES = 'activities',
  CAS2 = 'cas2',
  ALERTS = 'alerts',
  REPORTING = 'reporting',
  RESIDENTIAL_LOCATIONS = 'residentialLocations',
  LEARNING_AND_WORK_PROGRESS = 'learningAndWorkProgress',
}

export interface ServiceActiveAgencies {
  app: ServiceName
  activeAgencies: string[]
}
