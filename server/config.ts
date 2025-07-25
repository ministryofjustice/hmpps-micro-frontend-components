const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: AgentConfig
}

export default {
  ingressUrl: get('INGRESS_URL', 'localhost', requiredInProduction),
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  branchName: get('GIT_BRANCH', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  https: production,
  staticResourceCacheDuration: '1h',
  redis: {
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
    cacheTimeout: Number(get('CACHE_TIMOUT', 600)),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  app: {
    covidUnitsEnabled: process.env.COVID_UNITS_ENABLED === 'true',
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'clientid', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    prisonApi: {
      url: get('PRISON_API_URL', 'http://localhost:8082', requiredInProduction),
      timeout: {
        response: Number(get('PRISON_API_TIMEOUT_RESPONSE', 20000)),
        deadline: Number(get('PRISON_API_TIMEOUT_DEADLINE', 20000)),
      },
      agent: new AgentConfig(Number(get('PRISON_API_TIMEOUT_DEADLINE', 20000))),
    },
    allocationsApi: {
      url: get('ALLOCATIONS_API_URL', 'http://localhost:8082', requiredInProduction),
      timeout: {
        response: Number(get('ALLOCATIONS_API_TIMEOUT_RESPONSE', 3000)),
        deadline: Number(get('ALLOCATIONS_API_TIMEOUT_DEADLINE', 3000)),
      },
      agent: new AgentConfig(Number(get('ALLOCATIONS_API_TIMEOUT_DEADLINE', 3000))),
    },
  },
  supportUrl: get('SUPPORT_URL', 'http://localhost:3001', requiredInProduction),
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  contentful: {
    host: get('CONTENTFUL_HOST', ''),
    spaceId: get('CONTENTFUL_SPACE_ID', 'spaceId', requiredInProduction),
    environment: get('CONTENTFUL_ENVIRONMENT', 'environment', requiredInProduction),
    accessToken: get('CONTENTFUL_ACCESS_TOKEN', 'token', requiredInProduction),
  },
  contentfulFooterLinksEnabled: get('CONTENTFUL_FOOTER_LINKS_ENABLED', 'false', requiredInProduction) === 'true',
  environmentName: get('ENVIRONMENT_NAME', ''),
  serviceUrls: {
    dps: { url: get('DPS_URL', 'http://localhost:3001', requiredInProduction) },
    newDps: { url: get('NEW_DPS_URL', 'http://localhost:3002', requiredInProduction) },
    omic: { url: get('OMIC_URL', 'http://localhost:3001', requiredInProduction) },
    activities: {
      url: get('ACTIVITIES_URL', 'http://localhost:3001', requiredInProduction),
      enabledPrisons: get('ACTIVITIES_ENABLED_PRISONS', '', requiredInProduction),
    },
    appointments: {
      url: get('APPOINTMENTS_URL', 'http://localhost:3001', requiredInProduction),
      enabledPrisons: get('APPOINTMENTS_ENABLED_PRISONS', '', requiredInProduction),
    },
    checkMyDiary: {
      url: get('CHECK_MY_DIARY_URL', 'http://localhost:3001', requiredInProduction),
    },
    incentives: {
      url: get('INCENTIVES_URL', 'http://localhost:3001', requiredInProduction),
    },
    useOfForce: {
      url: get('USE_OF_FORCE_URL', 'http://localhost:3001', requiredInProduction),
      enabledPrisons: get('USE_OF_FORCE_PRISONS', '', requiredInProduction),
    },
    pathfinder: {
      url: get('PATHFINDER_URL', 'http://localhost:3001', requiredInProduction),
    },
    licences: {
      url: get('LICENCES_URL', 'http://localhost:3001', requiredInProduction),
    },
    moic: {
      url: get('MOIC_URL', 'http://localhost:3001', requiredInProduction),
    },
    manageAccounts: {
      url: get('MANAGE_AUTH_ACCOUNTS_URL', 'http://localhost:3001', requiredInProduction),
    },
    categorisation: {
      url: get('CATEGORISATION_URL', 'http://localhost:3001', requiredInProduction),
    },
    pecs: {
      url: get('PECS_URL', 'http://localhost:3001', requiredInProduction),
    },
    soc: {
      url: get('SOC_URL', 'http://localhost:3001', requiredInProduction),
    },
    pinPhones: {
      url: get('PIN_PHONES_URL', 'http://localhost:3001', requiredInProduction),
    },
    manageAdjudications: {
      url: get('MANAGE_ADJUDICATIONS_URL', 'http://localhost:3001', requiredInProduction),
      enabledPrisons: get('MANAGE_ADJUDICATIONS_ENABLED', '', requiredInProduction),
    },
    managePrisonVisits: {
      url: get('MANAGE_PRISON_VISITS_URL', 'http://localhost:3001', requiredInProduction),
    },
    legacyPrisonVisits: {
      url: get('LEGACY_PRISON_VISITS_URL', 'http://localhost:3001', requiredInProduction),
    },
    secureSocialVideoCalls: {
      url: get('SECURE_SOCIAL_VIDEO_CALLS_URL', 'http://localhost:3001', requiredInProduction),
    },
    sendLegalMail: {
      url: get('SEND_LEGAL_MAIL_URL', 'http://localhost:3001', requiredInProduction),
    },
    welcomePeopleIntoPrison: {
      url: get('WELCOME_PEOPLE_INTO_PRISON_URL', 'http://localhost:3001', requiredInProduction),
      enabledPrisons: get('WELCOME_PEOPLE_INTO_PRISON_ENABLED_PRISONS', '', requiredInProduction),
    },
    mercurySubmit: {
      url: get('MERCURY_SUBMIT_URL', 'http://localhost:3001', requiredInProduction),
    },
    manageIntelligence: {
      url: get('MANAGE_INTELLIGENCE_URL', 'http://localhost:3001', requiredInProduction),
    },
    manageRestrictedPatients: {
      url: get('MANAGE_RESTRICTED_PATIENTS_URL', 'http://localhost:3001', requiredInProduction),
    },
    createAndVaryALicence: {
      url: get('CREATE_AND_VARY_A_LICENCE_URL', 'http://localhost:3001', requiredInProduction),
    },
    historicalPrisonerApplication: {
      url: get('HISTORICAL_PRISONER_APPLICATION_URL', 'http://localhost:3001', requiredInProduction),
    },
    workAfterLeavingPrison: {
      url: get('WORK_AFTER_LEAVING_PRISON_URL', 'http://localhost:3001', requiredInProduction),
    },
    matchLearnerRecord: {
      url: get('MATCH_LEARNER_RECORD_URL', 'http://localhost:3001', requiredInProduction),
      enabled: get('MATCH_LEARNER_RECORD_ENABLED', 'false') === 'true',
    },
    manageOffences: {
      url: get('MANAGE_OFFENCES_URL', 'http://localhost:3001', requiredInProduction),
    },
    learningAndWorkProgress: {
      url: get('LEARNING_AND_WORK_PROGRESS_URL', 'http://localhost:3001', requiredInProduction),
    },
    prepareSomeoneForReleaseUi: {
      url: get('PREPARE_SOMEONE_FOR_RELEASE_URL', 'http://localhost:3001', requiredInProduction),
    },
    cas2: {
      url: get('CAS2_URL', 'http://localhost:3001', requiredInProduction),
    },
    cas2Bail: {
      url: get('CAS2_BAIL_URL', 'http://localhost:3001', requiredInProduction),
    },
    changeSomeonesCell: {
      url: get('CHANGE_SOMEONES_CELL_URL', 'http://localhost:3001', requiredInProduction),
    },
    accreditedProgrammes: {
      url: get('ACCREDITED_PROGRAMMES_URL', 'http://localhost:3001', requiredInProduction),
      enabled: get('ACCREDITED_PROGRAMMES_ENABLED', 'false') === 'true',
    },
    alerts: {
      url: get('ALERTS_API_URL', 'http://localhost:3001', requiredInProduction),
    },
    csipApi: {
      url: get('CSIP_API_URL', 'http://localhost:3001', requiredInProduction),
    },
    csipUI: {
      url: get('CSIP_UI_URL', 'http://localhost:3001', requiredInProduction),
    },
    caseNotesApi: {
      url: get('CASE_NOTES_API_URL', 'http://localhost:3001', requiredInProduction),
    },
    residentialLocations: {
      url: get('RESIDENTIAL_LOCATIONS_URL', 'http://localhost:3001', requiredInProduction),
    },
    reporting: {
      url: get('REPORTING_URL', 'http://localhost:3001', requiredInProduction),
      enabledPrisons: get('REPORTING_ENABLED_PRISONS', '', requiredInProduction),
    },
    whereabouts: {
      apiUrl: get('WHEREABOUTS_API_URL', 'http://localhost:3001', requiredInProduction),
    },
    incidentReporting: {
      url: get('INCIDENT_REPORTING_URL', 'http://localhost:3001', requiredInProduction),
    },
    manageApplications: {
      url: get('MANAGE_APPLICATIONS_URL', 'http://localhost:3001', requiredInProduction),
    },
    establishmentRoll: {
      url: get('ESTABLISHMENT_ROLL_URL', 'http://localhost:3001', requiredInProduction),
    },
    createAnEMOrder: {
      url: get('CEMO_URL', 'http://localhost:3001', requiredInProduction),
    },
    allocateKeyWorkers: {
      url: get('ALLOCATE_KEY_WORKERS_UI_URL', 'http://localhost:3001', requiredInProduction),
    },
    allocatePersonalOfficers: {
      url: get('ALLOCATE_PERSONAL_OFFICERS_UI_URL', 'http://localhost:3001', requiredInProduction),
    },
  },
  features: {
    servicesStore: {
      enabled: get('FEATURE_SERVICES_STORE_ENABLED', 'false', requiredInProduction) === 'true',
    },
  },
}
