import { Role } from './roles'
import getServicesForUser from './getServicesForUser'
import { ServiceName } from '../../@types/activeAgencies'

jest.mock('../../config', () => ({
  app: {
    covidUnitsEnabled: true,
  },
  serviceUrls: {
    activities: { url: 'url', enabledPrisons: 'LEI,LIV' },
    appointments: { url: 'url', enabledPrisons: 'LEI,SOM' },
    dps: { url: 'http://old-dps.com' },
    newDps: { url: 'http://new-dps.com' },
    omic: { url: 'url' },
    checkMyDiary: { url: 'url' },
    incentives: { url: 'url' },
    useOfForce: { url: 'url', enabledPrisons: 'LEI,LIV' },
    pathfinder: { url: 'url' },
    licences: { url: 'url' },
    moic: { url: 'url' },
    manageAccounts: { url: 'url' },
    categorisation: { url: 'url' },
    pecs: { url: 'url' },
    soc: { url: 'url' },
    pinPhones: { url: 'url' },
    manageAdjudications: { url: 'url', enabledPrisons: 'LEI,LIV' },
    managePrisonVisits: { url: 'url' },
    legacyPrisonVisits: { url: 'url' },
    secureSocialVideoCalls: { url: 'url' },
    sendLegalMail: { url: 'url' },
    welcomePeopleIntoPrison: { url: 'url', enabledPrisons: 'LEI,LIV' },
    mercurySubmit: { url: 'url' },
    manageIntelligence: { url: 'url' },
    manageRestrictedPatients: { url: 'url' },
    createAndVaryALicence: { url: 'url' },
    historicalPrisonerApplication: { url: 'url' },
    workAfterRelease: { url: 'url' },
    manageOffences: { url: 'url' },
    learningAndWorkProgress: { url: 'url' },
    prepareSomeoneForReleaseUi: { url: 'url' },
    cas2: { url: 'url' },
    cas2Bail: { url: 'url' },
    changeSomeonesCell: { url: 'url' },
    accreditedProgrammes: { url: 'url' },
    alerts: { url: 'url' },
    csipUI: { url: 'url' },
    reporting: { url: 'url', enabledPrisons: 'AAA' },
    residentialLocations: { url: 'url' },
    incidentReporting: { url: 'url' },
    caseNotesApi: { url: 'url' },
    establishmentRoll: { url: 'url' },
    manageApplications: { url: 'url' },
    createAnEMOrder: { url: 'url' },
    allocateKeyWorkers: { url: 'url' },
    allocatePersonalOfficers: { url: 'url' },
    matchLearnerRecord: { url: 'url', enabled: true },
  },
}))

describe('getServicesForUser', () => {
  describe('Global search', () => {
    test.each`
      roles                  | visible
      ${[Role.GlobalSearch]} | ${true}
      ${[]}                  | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Global search')).toEqual(visible)
    })
  })

  describe('Keyworker allocation', () => {
    test.each`
      isKeyworker | activeServices                                                          | visible
      ${true}     | ${[]}                                                                   | ${true}
      ${true}     | ${[{ app: ServiceName.ALLOCATE_KEY_WORKERS, activeAgencies: ['LEI'] }]} | ${false}
      ${false}    | ${[]}                                                                   | ${false}
    `('user with staffRoles: $staffRoles, can see: $visible', ({ isKeyworker, activeServices, visible }) => {
      const output = getServicesForUser([], isKeyworker, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.id === 'key-worker-allocations')).toEqual(visible)
    })
  })

  describe('Prisoner whereabouts', () => {
    test.each`
      roles | activeServices                                       | visible
      ${[]} | ${[{ app: 'whereabouts', activeAgencies: ['LEI'] }]} | ${true}
      ${[]} | ${[{ app: 'whereabouts', activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Prisoner whereabouts')).toEqual(visible)
    })
  })

  describe('Change someone’s cell', () => {
    test.each`
      roles              | visible
      ${[Role.CellMove]} | ${true}
      ${[]}              | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Change someone’s cell')).toEqual(visible)
    })
  })

  describe('Check my diary', () => {
    it('should return true', () => {
      const output = getServicesForUser([], false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Check my diary')).toEqual(true)
    })
  })

  describe('Incentives', () => {
    test.each`
      roles                             | visible
      ${[Role.MaintainIncentiveLevels]} | ${true}
      ${[]}                             | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Incentives')).toEqual(visible)
    })
  })

  describe('Use of force incidents', () => {
    test.each`
      activeCaseLoad | visible
      ${'LEI'}       | ${true}
      ${'SOM'}       | ${false}
    `('caseload: $activeCaseLoad, can see: $visible', ({ activeCaseLoad, visible }) => {
      const output = getServicesForUser([], false, { policies: [] }, activeCaseLoad, 12345, [], null)
      expect(!!output.find(service => service.heading === 'Use of force incidents')).toEqual(visible)
    })
  })

  describe('Pathfinder', () => {
    test.each`
      roles                                                       | visible
      ${[Role.PathfinderAdmin]}                                   | ${true}
      ${[Role.PathfinderUser]}                                    | ${true}
      ${[Role.PathfinderStdPrison]}                               | ${true}
      ${[Role.PathfinderStdProbation]}                            | ${true}
      ${[Role.PathfinderApproval]}                                | ${true}
      ${[Role.PathfinderStdPrisonRo]}                             | ${true}
      ${[Role.PathfinderStdProbationRo]}                          | ${true}
      ${[Role.PathfinderPolice]}                                  | ${true}
      ${[Role.PathfinderPsychologist]}                            | ${true}
      ${[Role.PathfinderHQ]}                                      | ${true}
      ${[Role.PathfinderNationalReader]}                          | ${true}
      ${[Role.PathfinderLocalReader]}                             | ${true}
      ${[Role.PathfinderLocalReader, Role.PathfinderLocalReader]} | ${true}
      ${[]}                                                       | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Pathfinder')).toEqual(visible)
    })
  })

  describe('Pathfinder', () => {
    test.each`
      roles                     | visible
      ${[Role.NomisBatchload]}  | ${true}
      ${[Role.LicenceCa]}       | ${true}
      ${[Role.LicenceDm]}       | ${true}
      ${[Role.LicenceRo]}       | ${true}
      ${[Role.LicenceVary]}     | ${true}
      ${[Role.LicenceReadOnly]} | ${true}
      ${[]}                     | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Home Detention Curfew')).toEqual(visible)
    })
  })

  describe('Establishment roll check', () => {
    test.each`
      locations | visible  | activeCaseLoadId
      ${[]}     | ${false} | ${'MDI'}
      ${[{}]}   | ${true}  | ${'MDI'}
      ${[{}]}   | ${true}  | ${'DNI'}
    `('user with locations: $locations.length, can see: $visible', ({ locations, visible, activeCaseLoadId }) => {
      const output = getServicesForUser([], false, { policies: [] }, activeCaseLoadId, 12345, locations, null)
      expect(!!output.find(service => service.heading === 'Establishment roll check')).toEqual(visible)
    })
  })

  describe('Key workers', () => {
    test.each`
      roles                                      | activeServices                                                          | visible
      ${[Role.OmicAdmin]}                        | ${[]}                                                                   | ${true}
      ${[Role.KeyworkerMonitor]}                 | ${[]}                                                                   | ${true}
      ${[Role.OmicAdmin, Role.KeyworkerMonitor]} | ${[]}                                                                   | ${true}
      ${[Role.OmicAdmin, Role.KeyworkerMonitor]} | ${[{ app: ServiceName.ALLOCATE_KEY_WORKERS, activeAgencies: ['LEI'] }]} | ${false}
      ${[]}                                      | ${[]}                                                                   | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, activeServices, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.id === 'manage-key-workers')).toEqual(visible)
    })
  })

  describe('POM cases', () => {
    test.each`
      roles                                                     | visible
      ${[Role.AllocationsCaseManager]}                          | ${true}
      ${[Role.AllocationsManager]}                              | ${true}
      ${[Role.AllocationsManager, Role.AllocationsCaseManager]} | ${true}
      ${[]}                                                     | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'POM cases')).toEqual(visible)
    })
  })

  describe('Manage user accounts', () => {
    test.each`
      roles                                                                                                        | visible
      ${[Role.MaintainAccessRolesAdmin]}                                                                           | ${true}
      ${[Role.MaintainAccessRoles]}                                                                                | ${true}
      ${[Role.MaintainOauthUsers]}                                                                                 | ${true}
      ${[Role.AuthGroupManager]}                                                                                   | ${true}
      ${[Role.MaintainAccessRoles, Role.MaintainAccessRolesAdmin, Role.MaintainOauthUsers, Role.AuthGroupManager]} | ${true}
      ${[]}                                                                                                        | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Manage user accounts')).toEqual(visible)
    })
  })
  describe('Categorisation', () => {
    test.each`
      roles                                                                                                                | visible
      ${[Role.CreateCategorisation]}                                                                                       | ${true}
      ${[Role.CreateRecategorisation]}                                                                                     | ${true}
      ${[Role.ApproveCategorisation]}                                                                                      | ${true}
      ${[Role.CategorisationSecurity]}                                                                                     | ${true}
      ${[Role.CreateCategorisation, Role.CreateRecategorisation, Role.ApproveCategorisation, Role.CategorisationSecurity]} | ${true}
      ${[]}                                                                                                                | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Categorisation')).toEqual(visible)
    })
  })
  describe('Book a secure move', () => {
    test.each`
      roles                              | visible
      ${[Role.PecsOca, Role.PecsPrison]} | ${true}
      ${[Role.PecsOca]}                  | ${true}
      ${[Role.PecsPrison]}               | ${true}
      ${[]}                              | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Book a secure move')).toEqual(visible)
    })
  })
  describe('Manage SOC cases', () => {
    test.each`
      roles                                               | visible
      ${[Role.SocCustody, Role.SocCommunity, Role.SocHq]} | ${true}
      ${[Role.SocCustody]}                                | ${true}
      ${[Role.SocCommunity]}                              | ${true}
      ${[Role.SocHq]}                                     | ${true}
      ${[]}                                               | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Manage SOC cases')).toEqual(visible)
    })
  })
  describe('Prisoner communication monitoring service', () => {
    test.each`
      roles                                                                                    | visible
      ${[Role.PcmsAnalyst, Role.PcmsAuthorisingOfficer, Role.PcmsGlobalAdmin, Role.PcmsAudit]} | ${true}
      ${[Role.PcmsAnalyst]}                                                                    | ${true}
      ${[Role.PcmsAuthorisingOfficer]}                                                         | ${true}
      ${[Role.PcmsGlobalAdmin]}                                                                | ${true}
      ${[Role.PcmsAudit]}                                                                      | ${true}
      ${[]}                                                                                    | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Prisoner communication monitoring service')).toEqual(visible)
    })
  })

  describe('Adjudications', () => {
    test.each`
      desc                                            | activeCaseLoad      | visible  | activeServices
      ${'In cache and env var'} | ${'LEI'} | ${true} | ${[
  {
    app: 'adjudications' as ServiceName,
    activeAgencies: ['LEI', 'ANOTHER'],
  },
]}
      ${'Not in cache, in env var'} | ${'LEI'} | ${false} | ${[
  {
    app: 'adjudications' as ServiceName,
    activeAgencies: ['ANOTHER'],
  },
]}
      ${'In cache, not env var'} | ${'NOT_IN_ENV_VAR'} | ${true} | ${[
  {
    app: 'adjudications' as ServiceName,
    activeAgencies: ['NOT_IN_ENV_VAR'],
  },
]}
      ${'Empty array cache'} | ${'LEI'} | ${false} | ${[
  {
    app: 'adjudications' as ServiceName,
    activeAgencies: [],
  },
]}
      ${'all prsions cache'} | ${'ANYTHING'} | ${true} | ${[
  {
    app: 'adjudications' as ServiceName,
    activeAgencies: ['***'],
  },
]}
      ${'Not in cache, not in env var'} | ${'NOT_IN_ENV_VAR'} | ${false} | ${[
  {
    app: 'adjudications' as ServiceName,
    activeAgencies: ['LEI'],
  },
]}
      ${'No application data cached, in env var'}     | ${'LEI'}            | ${true}  | ${[]}
      ${'No application data cached, not in env var'} | ${'NOT_IN_ENV_VAR'} | ${false} | ${[]}
      ${'No cache, in env var'}                       | ${'LEI'}            | ${true}  | ${null}
      ${'No cache, not in env var'}                   | ${'NOT_IN_ENV_VAR'} | ${false} | ${null}
    `('caseload: $desc, can see: $visible', ({ activeCaseLoad, visible, activeServices }) => {
      const output = getServicesForUser([], false, { policies: [] }, activeCaseLoad, 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Adjudications')).toEqual(visible)
    })
  })

  describe('Manage prison visits', () => {
    test.each`
      roles                        | visible
      ${[Role.ManagePrisonVisits]} | ${true}
      ${[]}                        | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Manage prison visits')).toEqual(visible)
    })
  })

  describe('Online visit requests', () => {
    test.each`
      roles                 | visible
      ${[Role.PvbRequests]} | ${true}
      ${[]}                 | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Online visit requests')).toEqual(visible)
    })
  })

  describe('Secure social video calls', () => {
    test.each`
      roles                      | visible
      ${[Role.SocialVideoCalls]} | ${true}
      ${[]}                      | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Secure social video calls')).toEqual(visible)
    })
  })

  describe('Check Rule 39 mail', () => {
    test.each`
      roles                                   | visible
      ${[Role.SlmScanBarcode, Role.SlmAdmin]} | ${true}
      ${[Role.SlmScanBarcode]}                | ${true}
      ${[Role.SlmAdmin]}                      | ${true}
      ${[]}                                   | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Check Rule 39 mail')).toEqual(visible)
    })
  })

  describe('Welcome people into prison', () => {
    test.each`
      activeCaseLoad | visible
      ${'LEI'}       | ${true}
      ${'SOM'}       | ${false}
    `('caseload: $activeCaseLoad, can see: $visible', ({ activeCaseLoad, visible }) => {
      const output = getServicesForUser([], false, { policies: [] }, activeCaseLoad, 12345, [], null)
      expect(!!output.find(service => service.heading === 'Welcome people into prison')).toEqual(visible)
    })
  })

  describe('Submit an Intelligence Report', () => {
    it('should return true', () => {
      const output = getServicesForUser([], false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Submit an Intelligence Report')).toEqual(true)
    })
  })

  describe('Submit an IMS Report', () => {
    test.each`
      roles                            | visible
      ${[Role.ManageIntelligenceUser]} | ${true}
      ${[]}                            | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Intelligence management service')).toEqual(visible)
      expect(!!output.find(service => service.description === 'Manage and view intelligence reports')).toEqual(visible)
    })
  })

  describe('Manage restricted patients', () => {
    test.each`
      roles                                                                                                                            | visible
      ${[Role.SearchRestrictedPatient, Role.TransferRestrictedPatient, Role.RemoveRestrictedPatient, Role.RestrictedPatientMigration]} | ${true}
      ${[Role.SearchRestrictedPatient]}                                                                                                | ${true}
      ${[Role.TransferRestrictedPatient]}                                                                                              | ${true}
      ${[Role.RemoveRestrictedPatient]}                                                                                                | ${true}
      ${[Role.RestrictedPatientMigration]}                                                                                             | ${true}
      ${[]}                                                                                                                            | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Manage restricted patients')).toEqual(visible)
    })
  })

  describe('Create and vary a licence', () => {
    test.each`
      roles                                                                                   | visible
      ${[Role.LicenceCa, Role.LicenceDm, Role.LicenceRo, Role.LicenceAco, Role.LicenceAdmin]} | ${true}
      ${[Role.LicenceCa]}                                                                     | ${true}
      ${[Role.LicenceDm]}                                                                     | ${true}
      ${[Role.LicenceRo]}                                                                     | ${true}
      ${[Role.LicenceAco]}                                                                    | ${true}
      ${[Role.LicenceAdmin]}                                                                  | ${true}
      ${[]}                                                                                   | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Create and vary a licence')).toEqual(visible)
    })
  })

  describe('Activities, unlock and attendance', () => {
    test.each`
      desc                                            | activeCaseLoad      | visible  | activeServices
      ${'In cache and env var'} | ${'LEI'} | ${true} | ${[
  {
    app: 'appointments' as ServiceName,
    activeAgencies: ['LEI', 'FSI'],
  },
  { app: 'activities' as ServiceName, activeAgencies: ['LEI', 'CACHE'] },
]}
      ${'In cache, not env var'} | ${'CACHE'} | ${true} | ${[
  {
    app: 'appointments' as ServiceName,
    activeAgencies: ['LEI', 'FSI'],
  },
  { app: 'activities' as ServiceName, activeAgencies: ['LEI', 'CACHE'] },
]}
      ${'Not in cache, env var not enabled'}          | ${'NOT_IN_ENV_VAR'} | ${false} | ${null}
      ${'Not in cache, env var enabled'}              | ${'LEI'}            | ${true}  | ${null}
      ${'No application data cached, in env var'}     | ${'LEI'}            | ${true}  | ${[]}
      ${'No application data cached, not in env var'} | ${'NOT_IN_ENV_VAR'} | ${false} | ${[]}
    `('caseload: $desc, can see: $visible', ({ activeCaseLoad, visible, activeServices }) => {
      const output = getServicesForUser([], false, { policies: [] }, activeCaseLoad, 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Activities, unlock and attendance')).toEqual(visible)
    })
  })

  describe('Appointments scheduling and attendance', () => {
    test.each`
      desc                                                         | activeCaseLoad      | visible  | activeServices
      ${'In cache, not env var (activities)'} | ${'CACHE'} | ${true} | ${[
  {
    app: 'activities' as ServiceName,
    activeAgencies: ['LEI', 'CACHE'],
  },
]}
      ${'Not in cache, env var not enabled (activities)'}          | ${'NOT_IN_ENV_VAR'} | ${false} | ${null}
      ${'Not in cache, env var enabled (activities)'}              | ${'LEI'}            | ${true}  | ${null}
      ${'No application data cached, in env var (activities)'}     | ${'LEI'}            | ${true}  | ${[]}
      ${'No application data cached, not in env var (activities)'} | ${'NOT_IN_ENV_VAR'} | ${false} | ${[]}
    `('caseload: $desc, can see: $visible', ({ activeCaseLoad, visible, activeServices }) => {
      const output = getServicesForUser([], false, { policies: [] }, activeCaseLoad, 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Appointments scheduling and attendance')).toEqual(visible)
    })
  })

  describe('People due to leave', () => {
    test.each`
      desc                                                         | activeCaseLoad      | visible  | activeServices
      ${'In cache, not env var (activities)'} | ${'CACHE'} | ${true} | ${[
  {
    app: 'activities' as ServiceName,
    activeAgencies: ['LEI', 'CACHE'],
  },
]}
      ${'Not in cache, env var not enabled (activities)'}          | ${'NOT_IN_ENV_VAR'} | ${false} | ${null}
      ${'Not in cache, env var enabled (activities)'}              | ${'LEI'}            | ${true}  | ${null}
      ${'No application data cached, in env var (activities)'}     | ${'LEI'}            | ${true}  | ${[]}
      ${'No application data cached, not in env var (activities)'} | ${'NOT_IN_ENV_VAR'} | ${false} | ${[]}
    `('caseload: $desc, can see: $visible', ({ activeCaseLoad, visible, activeServices }) => {
      const output = getServicesForUser([], false, { policies: [] }, activeCaseLoad, 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'People due to leave')).toEqual(visible)
    })
  })

  describe('View COVID units', () => {
    test.each`
      roles                | caseLoad | visible
      ${[Role.PrisonUser]} | ${'LEI'} | ${true}
      ${[]}                | ${'LEI'} | ${false}
      ${[Role.PrisonUser]} | ${'LIV'} | ${true}
    `('user with roles and caseload: $roles, can see: $visible', ({ roles, caseLoad, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, caseLoad, 12345, [], null)
      expect(!!output.find(service => service.heading === 'View COVID units')).toEqual(visible)
    })
  })

  describe('Historical Prisoner Application', () => {
    test.each`
      roles             | visible
      ${[Role.HpaUser]} | ${true}
      ${[]}             | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Historical Prisoner Application')).toEqual(visible)
    })
  })
  describe('Work after leaving prison', () => {
    test.each`
      roles                                               | visible
      ${[Role.WorkReadinessView, Role.WorkReadinessEdit]} | ${true}
      ${[Role.WorkReadinessEdit]}                         | ${true}
      ${[Role.WorkReadinessView]}                         | ${true}
      ${[]}                                               | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Work after leaving prison')).toEqual(visible)
    })
  })
  describe('Match learner record', () => {
    test.each`
      roles                        | visible
      ${[Role.MatchLearnerRecord]} | ${true}
      ${[]}                        | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.id === 'match-learner-record')).toEqual(visible)
    })
  })

  describe('Manage offences', () => {
    test.each`
      roles                                                                                  | visible
      ${[Role.ManageOffencesAdmin, Role.UpdateOffenceSchedules, Role.NomisOffenceActivator]} | ${true}
      ${[Role.NomisOffenceActivator]}                                                        | ${true}
      ${[Role.UpdateOffenceSchedules]}                                                       | ${true}
      ${[Role.ManageOffencesAdmin]}                                                          | ${true}
      ${[]}                                                                                  | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Manage offences')).toEqual(visible)
    })
  })

  describe('Learning and work progress', () => {
    test.each`
      activeServices                                                                  | activeCaseLoadId | visible
      ${[{ app: 'learningAndWorkProgress' as ServiceName, activeAgencies: ['LEI'] }]} | ${'LEI'}         | ${true}
      ${[{ app: 'learningAndWorkProgress' as ServiceName, activeAgencies: ['***'] }]} | ${'LEI'}         | ${true}
      ${[{ app: 'learningAndWorkProgress' as ServiceName, activeAgencies: ['MDI'] }]} | ${'MDI'}         | ${true}
      ${[{ app: 'learningAndWorkProgress' as ServiceName, activeAgencies: ['LEI'] }]} | ${'MDI'}         | ${true}
      ${[]}                                                                           | ${'LEI'}         | ${true}
    `(
      'user with activeCaseLoadId: $activeCaseLoadId, can see: $visible',
      ({ activeServices, activeCaseLoadId, visible }) => {
        const output = getServicesForUser([], false, { policies: [] }, activeCaseLoadId, 12345, [], activeServices)
        expect(!!output.find(service => service.heading === 'Learning and work progress')).toEqual(visible)
      },
    )
  })

  describe('Prepare someone for release', () => {
    test.each`
      activeServices                                                                     | roles                              | visible
      ${[{ app: 'prepareSomeoneForReleaseUi' as ServiceName, activeAgencies: ['LEI'] }]} | ${[Role.ResettlementPassportEdit]} | ${true}
      ${[{ app: 'prepareSomeoneForReleaseUi' as ServiceName, activeAgencies: ['LEI'] }]} | ${[]}                              | ${false}
    `('user with roles: $roles, can see: $visible', ({ activeServices, roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Prepare someone for release')).toEqual(visible)
    })
  })

  describe('Prepare someone for release not displayed for non-eligible establishment', () => {
    test.each`
      roles                              | visible
      ${[Role.ResettlementPassportEdit]} | ${false}
      ${[]}                              | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'MOR', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Prepare someone for release')).toEqual(visible)
    })
  })

  describe('CAS2', () => {
    test.each`
      roles             | activeServices                                | visible
      ${[Role.PomUser]} | ${[{ app: 'cas2', activeAgencies: ['LEI'] }]} | ${true}
      ${[]}             | ${[{ app: 'cas2', activeAgencies: ['LEI'] }]} | ${false}
      ${[Role.PomUser]} | ${[{ app: 'cas2', activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'CAS2 for HDC - short-term accommodation')).toEqual(visible)
    })
  })

  describe('CAS2 Bail', () => {
    test.each`
      roles                            | visible
      ${[Role.Cas2PrisonBailReferrer]} | ${true}
      ${[]}                            | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'CAS2 for bail - short-term accommodation')).toEqual(visible)
    })
  })

  describe('Alerts', () => {
    test.each`
      roles | activeServices                                  | visible
      ${[]} | ${[{ app: 'alerts', activeAgencies: ['LEI'] }]} | ${true}
      ${[]} | ${[{ app: 'alerts', activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Alerts')).toEqual(visible)
    })
  })

  describe('Csip api', () => {
    test.each`
      roles | activeServices                                   | visible
      ${[]} | ${[{ app: 'csipApi', activeAgencies: ['LEI'] }]} | ${true}
      ${[]} | ${[{ app: 'csipApi', activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'CSIP')).toEqual(visible)
    })
  })

  describe('prepareSomeoneForRelease api', () => {
    test.each`
      roles                              | activeServices                                                      | visible
      ${[Role.ResettlementPassportEdit]} | ${[{ app: 'prepareSomeoneForReleaseUi', activeAgencies: ['LEI'] }]} | ${true}
      ${[]}                              | ${[{ app: 'prepareSomeoneForReleaseUi', activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Prepare someone for release')).toEqual(visible)
    })
  })

  describe('Residential Locations', () => {
    test.each`
      roles | visible | activeServices
      ${[]} | ${false} | ${[
  {
    app: 'residentialLocations' as ServiceName,
    activeAgencies: ['LEI', 'CACHE'],
  },
]}
      ${['VIEW_INTERNAL_LOCATION']} | ${true} | ${[
  {
    app: 'residentialLocations' as ServiceName,
    activeAgencies: ['LEI', 'CACHE'],
  },
]}
      ${['VIEW_INTERNAL_LOCATION']} | ${false} | ${[
  {
    app: 'residentialLocations' as ServiceName,
    activeAgencies: ['PVI'],
  },
]}
      ${['MANAGE_RESIDENTIAL_LOCATIONS']} | ${true} | ${[
  {
    app: 'residentialLocations' as ServiceName,
    activeAgencies: ['***'],
  },
]}
      ${['MANAGE_RES_LOCATIONS_OP_CAP']} | ${true} | ${[
  {
    app: 'residentialLocations' as ServiceName,
    activeAgencies: ['***'],
  },
]}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Residential locations')).toEqual(visible)
    })
  })

  describe('Reporting', () => {
    test.each`
      activeCaseLoad | visible  | activeServices
      ${'LEI'}       | ${true}  | ${[{ app: 'reporting' as ServiceName, activeAgencies: ['LEI', 'ANOTHER'] }]}
      ${'LEI'}       | ${false} | ${[{ app: 'reporting' as ServiceName, activeAgencies: ['ANOTHER'] }]}
      ${'AAA'}       | ${true}  | ${[{ app: 'another' as ServiceName, activeAgencies: ['LEI'] }]}
      ${'BBB'}       | ${false} | ${[{ app: 'another' as ServiceName, activeAgencies: ['LEI'] }]}
    `('caseload: $activeCaseLoad, can see: $visible', ({ activeCaseLoad, visible, activeServices }) => {
      const output = getServicesForUser([], false, { policies: [] }, activeCaseLoad, 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Reporting')).toEqual(visible)
    })
  })

  describe('Incident reporting', () => {
    test.each`
      roles | visible | activeServices
      ${[]} | ${false} | ${[
  {
    app: 'incidentReporting' as ServiceName,
    activeAgencies: ['LEI', 'CACHE'],
  },
]}
      ${['INCIDENT_REPORTS__RO']} | ${true} | ${[
  {
    app: 'incidentReporting' as ServiceName,
    activeAgencies: ['LEI', 'CACHE'],
  },
]}
      ${['INCIDENT_REPORTS__RO']} | ${false} | ${[
  {
    app: 'incidentReporting' as ServiceName,
    activeAgencies: ['PVI'],
  },
]}
      ${['INCIDENT_REPORTS__RW']} | ${true} | ${[
  {
    app: 'incidentReporting' as ServiceName,
    activeAgencies: ['***'],
  },
]}
      ${['INCIDENT_REPORTS__APPROVE']} | ${true} | ${[
  {
    app: 'incidentReporting' as ServiceName,
    activeAgencies: ['***'],
  },
]}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Incident reporting')).toEqual(visible)
    })
  })

  describe('Case Notes', () => {
    test.each`
      roles | activeServices                                        | visible
      ${[]} | ${[{ app: 'caseNotesApi', activeAgencies: ['LEI'] }]} | ${true}
      ${[]} | ${[{ app: 'caseNotesApi', activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Case Notes API')).toEqual(visible)
    })
  })

  describe('Dietary requirements', () => {
    test.each`
      roles                            | visible
      ${[Role.DietAndAllergiesReport]} | ${true}
      ${[]}                            | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(!!output.find(service => service.heading === 'Dietary requirements')).toEqual(visible)
    })
  })

  describe('Manage Applications', () => {
    test.each`
      roles                | activeServices                                              | visible
      ${[Role.PrisonUser]} | ${[{ app: 'manageApplications', activeAgencies: ['LEI'] }]} | ${true}
      ${[]}                | ${[{ app: 'manageApplications', activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Applications')).toEqual(visible)
    })
  })

  describe('Handle invalid activeAgencies', () => {
    test.each`
      roles | activeServices                                          | visible
      ${[]} | ${[{ app: 'caseNotesApi', activeAgencies: ['LEI'] }]}   | ${true}
      ${[]} | ${[{ app: 'caseNotesApi', activeAgencies: undefined }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Case Notes API')).toEqual(visible)
    })
  })

  describe('Create an electronic monitoring order', () => {
    test.each`
      roles                     | visible
      ${[Role.CreateAnEMOrder]} | ${true}
      ${[]}                     | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], null)
      expect(
        !!output.find(service => service.heading === 'Apply, change or end an Electronic Monitoring Order (EMO)'),
      ).toEqual(visible)
    })
  })

  describe('Allocate Key Worker', () => {
    test.each`
      roles               | activeServices                                                          | visible
      ${[Role.OmicAdmin]} | ${[{ app: ServiceName.ALLOCATE_KEY_WORKERS, activeAgencies: ['LEI'] }]} | ${true}
      ${[]}               | ${[{ app: ServiceName.ALLOCATE_KEY_WORKERS, activeAgencies: ['LEI'] }]} | ${false}
      ${[Role.OmicAdmin]} | ${[{ app: ServiceName.ALLOCATE_KEY_WORKERS, activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.id === 'allocate-key-workers')).toEqual(visible)
    })
  })

  describe('My Key Worker allocation', () => {
    test.each`
      allocationJobResponsibilities | activeServices                                                          | visible
      ${['KEY_WORKER']}             | ${[{ app: ServiceName.ALLOCATE_KEY_WORKERS, activeAgencies: ['LEI'] }]} | ${true}
      ${[]}                         | ${[{ app: ServiceName.ALLOCATE_KEY_WORKERS, activeAgencies: ['LEI'] }]} | ${false}
      ${['KEY_WORKER']}             | ${[{ app: ServiceName.ALLOCATE_KEY_WORKERS, activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ allocationJobResponsibilities, visible, activeServices }) => {
      const output = getServicesForUser(
        [],
        false,
        { policies: allocationJobResponsibilities },
        'LEI',
        12345,
        [],
        activeServices,
      )
      expect(!!output.find(service => service.id === 'my-key-worker-allocations')).toEqual(visible)
    })
  })

  describe('Allocate Personal Officer', () => {
    test.each`
      roles                             | activeServices                                                                | visible
      ${[Role.PersonalOfficerAllocate]} | ${[{ app: ServiceName.ALLOCATE_PERSONAL_OFFICERS, activeAgencies: ['LEI'] }]} | ${true}
      ${[]}                             | ${[{ app: ServiceName.ALLOCATE_PERSONAL_OFFICERS, activeAgencies: ['LEI'] }]} | ${false}
      ${[Role.PersonalOfficerAllocate]} | ${[{ app: ServiceName.ALLOCATE_PERSONAL_OFFICERS, activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible, activeServices }) => {
      const output = getServicesForUser(roles, false, { policies: [] }, 'LEI', 12345, [], activeServices)
      expect(!!output.find(service => service.heading === 'Personal officers')).toEqual(visible)
    })
  })

  describe('My Personal Officer allocation', () => {
    test.each`
      allocationJobResponsibilities | activeServices                                                                | visible
      ${['PERSONAL_OFFICER']}       | ${[{ app: ServiceName.ALLOCATE_PERSONAL_OFFICERS, activeAgencies: ['LEI'] }]} | ${true}
      ${[]}                         | ${[{ app: ServiceName.ALLOCATE_PERSONAL_OFFICERS, activeAgencies: ['LEI'] }]} | ${false}
      ${['PERSONAL_OFFICER']}       | ${[{ app: ServiceName.ALLOCATE_PERSONAL_OFFICERS, activeAgencies: ['MOR'] }]} | ${false}
    `('user with roles: $roles, can see: $visible', ({ allocationJobResponsibilities, visible, activeServices }) => {
      const output = getServicesForUser(
        [],
        false,
        { policies: allocationJobResponsibilities },
        'LEI',
        12345,
        [],
        activeServices,
      )
      expect(!!output.find(service => service.heading === 'My personal officer allocations')).toEqual(visible)
    })
  })
})
