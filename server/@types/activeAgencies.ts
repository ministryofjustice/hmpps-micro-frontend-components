/**
 * List of services
 * Mainly for mapping in a cache which agencies/prisons they are active in
 */
export enum ServiceName {
  ACTIVITIES = 'activities',
  ADJUDICATION = 'adjudications',
  ALERTS = 'alerts',
  ALLOCATE_KEY_WORKERS = 'allocateKeyWorkers',
  ALLOCATE_PERSONAL_OFFICERS = 'allocatePersonalOfficers',
  CAS2 = 'cas2',
  CASE_NOTES = 'caseNotesApi',
  CEMO = 'cemo',
  COURT_APPEARANCE_SCHEDULER = 'courtAppearanceScheduler',
  CSIP = 'csipApi',
  EXTERNAL_MOVEMENTS = 'externalMovements',
  INCIDENT_REPORTING = 'incidentReporting',
  LEARNING_AND_WORK_PROGRESS = 'learningAndWorkProgress',
  MANAGE_APPLICATIONS = 'manageApplications',
  OFFICIAL_VISITS_API = 'officialVisitsApi',
  PREPARE_SOMEONE_FOR_RELEASE = 'prepareSomeoneForReleaseUi',
  REPORTING = 'reporting',
  RESIDENTIAL_LOCATIONS = 'residentialLocations',
  WHEREABOUTS = 'whereabouts',
  // NB: keep service list sorted
}

/**
 * Used to map services to agencies/prisons where they are active
 * NB: `***` is a special value indicating *everywhere*
 */
export interface ServiceActiveAgencies {
  app: ServiceName
  activeAgencies: string[]
}
