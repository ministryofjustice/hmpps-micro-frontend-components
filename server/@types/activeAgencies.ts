// eslint-disable-next-line no-shadow
export enum ServiceName {
  ADJUDICATION = 'adjudications',
}

export interface ServiceActiveAgencies {
  app: ServiceName
  activeAgencies: string[]
}
