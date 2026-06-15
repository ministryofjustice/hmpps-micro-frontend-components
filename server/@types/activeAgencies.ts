/**
 * List of services
 * Mainly for mapping in a cache which agencies/prisons they are active in
 */
export enum ServiceName {
  ADJUDICATION = 'adjudications',
  ACTIVITIES = 'activities',
  CAS2 = 'cas2',
  ALERTS = 'alerts',
  CSIP = 'csipApi',
  CASE_NOTES = 'caseNotesApi',
  REPORTING = 'reporting',
  RESIDENTIAL_LOCATIONS = 'residentialLocations',
  LEARNING_AND_WORK_PROGRESS = 'learningAndWorkProgress',
  WHEREABOUTS = 'whereabouts',
  INCIDENT_REPORTING = 'incidentReporting',
  OFFICIAL_VISITS_API = 'officialVisitsApi',
  PREPARE_SOMEONE_FOR_RELEASE = 'prepareSomeoneForReleaseUi',
  CEMO = 'cemo',
  MANAGE_APPLICATIONS = 'manageApplications',
  ALLOCATE_KEY_WORKERS = 'allocateKeyWorkers',
  ALLOCATE_PERSONAL_OFFICERS = 'allocatePersonalOfficers',
  EXTERNAL_MOVEMENTS = 'externalMovements',
  COURT_APPEARANCE_SCHEDULER = 'courtAppearanceScheduler',
}

/**
 * Used to map services to agencies/prisons where they are active
 * NB: `***` is a special value indicating *everywhere*
 */
export interface ServiceActiveAgencies {
  app: ServiceName
  activeAgencies: string[]
}
