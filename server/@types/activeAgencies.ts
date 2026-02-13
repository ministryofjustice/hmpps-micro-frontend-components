export enum ServiceName {
  ADJUDICATION = 'adjudications',
  ACTIVITIES = 'activities',
  CAS2 = 'cas2',
  ALERTS = 'alerts',
  CSIP = 'csipApi',
  CASE_NOTES = 'caseNotesApi',
  REPORTING = 'reporting',
  RESIDENTIAL_LOCATIONS = 'residentialLocations',
  NON_RESIDENTIAL_LOCATIONS = 'nonResidentialLocations',
  LEARNING_AND_WORK_PROGRESS = 'learningAndWorkProgress',
  WHEREABOUTS = 'whereabouts',
  INCIDENT_REPORTING = 'incidentReporting',
  PREPARE_SOMEONE_FOR_RELEASE = 'prepareSomeoneForReleaseUi',
  CEMO = 'cemo',
  MANAGE_APPLICATIONS = 'manageApplications',
  ALLOCATE_KEY_WORKERS = 'allocateKeyWorkers',
  ALLOCATE_PERSONAL_OFFICERS = 'allocatePersonalOfficers',
  EXTERNAL_MOVEMENTS = 'externalMovements',
}

export interface ServiceActiveAgencies {
  app: ServiceName
  activeAgencies: string[]
}
