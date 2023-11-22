import { Role } from './roles'
import getServicesForUser from './getServicesForUser'

jest.mock('../../config', () => ({
  serviceUrls: {
    activities: { url: 'url', enabledPrisons: 'LEI,LIV' },
    appointments: { url: 'url', enabledPrisons: 'LEI,SOM' },
    dps: { url: 'url' },
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
    manageRestrictedPatients: { url: 'url' },
    createAndVaryALicence: { url: 'url' },
    historicalPrisonerApplication: { url: 'url' },
    getSomeoneReadyForWork: { url: 'url' },
    manageOffences: { url: 'url' },
    learningAndWorkProgress: { url: 'url' },
    prepareSomeoneForRelease: { url: 'url' },
  },
}))

describe('getServicesForUser', () => {
  describe('Global search', () => {
    test.each`
      roles                  | visible
      ${[Role.GlobalSearch]} | ${true}
      ${[]}                  | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Global search')).toEqual(visible)
    })
  })

  describe('Keyworker allocation', () => {
    test.each`
      staffRoles          | visible
      ${[{ role: 'KW' }]} | ${true}
      ${[]}               | ${false}
    `('user with staffRoles: $staffRoles, can see: $visible', ({ staffRoles, visible }) => {
      const output = getServicesForUser([], staffRoles, 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'My key worker allocation')).toEqual(visible)
    })
  })

  describe('Prisoner whereabouts', () => {
    test.each`
      activeCaseLoad | visible
      ${'LEI'}       | ${false}
      ${'SOM'}       | ${false}
      ${'LIV'}       | ${false}
      ${'ELSE'}      | ${true}
    `('caseload without activities and appointments enabled, can see: $visible', ({ activeCaseLoad, visible }) => {
      const output = getServicesForUser([], [], activeCaseLoad, 12345, [])
      expect(!!output.find(service => service.heading === 'Prisoner whereabouts')).toEqual(visible)
    })
  })

  describe('Change someone’s cell', () => {
    test.each`
      roles              | visible
      ${[Role.CellMove]} | ${true}
      ${[]}              | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Change someone’s cell')).toEqual(visible)
    })
  })

  describe('Check my diary', () => {
    it('should return true', () => {
      const output = getServicesForUser([], [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Check my diary')).toEqual(true)
    })
  })

  describe('Incentives', () => {
    test.each`
      roles                             | visible
      ${[Role.MaintainIncentiveLevels]} | ${true}
      ${[]}                             | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Incentives')).toEqual(visible)
    })
  })

  describe('Use of force incidents', () => {
    test.each`
      activeCaseLoad | visible
      ${'LEI'}       | ${true}
      ${'SOM'}       | ${false}
    `('caseload: $activeCaseLoad, can see: $visible', ({ activeCaseLoad, visible }) => {
      const output = getServicesForUser([], [], activeCaseLoad, 12345, [])
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Home Detention Curfew')).toEqual(visible)
    })
  })

  describe('Establishment roll check', () => {
    test.each`
      locations | visible
      ${[]}     | ${false}
      ${[{}]}   | ${true}
    `('user with locations: $locations.length, can see: $visible', ({ locations, visible }) => {
      const output = getServicesForUser([], [], 'LEI', 12345, locations)
      expect(!!output.find(service => service.heading === 'Establishment roll check')).toEqual(visible)
    })
  })

  describe('Key workers', () => {
    test.each`
      roles                                      | visible
      ${[Role.OmicAdmin]}                        | ${true}
      ${[Role.KeyworkerMonitor]}                 | ${true}
      ${[Role.OmicAdmin, Role.KeyworkerMonitor]} | ${true}
      ${[]}                                      | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Key workers')).toEqual(visible)
    })
  })

  describe('View POM cases', () => {
    test.each`
      roles                                                     | visible
      ${[Role.AllocationsCaseManager]}                          | ${true}
      ${[Role.AllocationsManager]}                              | ${true}
      ${[Role.AllocationsManager, Role.AllocationsCaseManager]} | ${true}
      ${[]}                                                     | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'View POM cases')).toEqual(visible)
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Prisoner communication monitoring service')).toEqual(visible)
    })
  })

  describe('Adjudications', () => {
    test.each`
      activeCaseLoad | visible
      ${'LEI'}       | ${true}
      ${'SOM'}       | ${false}
    `('caseload: $activeCaseLoad, can see: $visible', ({ activeCaseLoad, visible }) => {
      const output = getServicesForUser([], [], activeCaseLoad, 12345, [])
      expect(!!output.find(service => service.heading === 'Adjudications')).toEqual(visible)
    })
  })

  describe('Manage prison visits', () => {
    test.each`
      roles                        | visible
      ${[Role.ManagePrisonVisits]} | ${true}
      ${[]}                        | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Manage prison visits')).toEqual(visible)
    })
  })

  describe('Online visit requests', () => {
    test.each`
      roles                 | visible
      ${[Role.PvbRequests]} | ${true}
      ${[]}                 | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Online visit requests')).toEqual(visible)
    })
  })

  describe('Secure social video calls', () => {
    test.each`
      roles                      | visible
      ${[Role.SocialVideoCalls]} | ${true}
      ${[]}                      | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Check Rule 39 mail')).toEqual(visible)
    })
  })

  describe('Welcome people into prison', () => {
    test.each`
      activeCaseLoad | visible
      ${'LEI'}       | ${true}
      ${'SOM'}       | ${false}
    `('caseload: $activeCaseLoad, can see: $visible', ({ activeCaseLoad, visible }) => {
      const output = getServicesForUser([], [], activeCaseLoad, 12345, [])
      expect(!!output.find(service => service.heading === 'Welcome people into prison')).toEqual(visible)
    })
  })

  describe('Submit an Intelligence Report', () => {
    it('should return true', () => {
      const output = getServicesForUser([], [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Submit an Intelligence Report')).toEqual(true)
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Create and vary a licence')).toEqual(visible)
    })
  })

  describe('Allocate people, unlock and attend', () => {
    test.each`
      activeCaseLoad | visible
      ${'LEI'}       | ${true}
      ${'SOM'}       | ${false}
    `('caseload: $activeCaseLoad, can see: $visible', ({ activeCaseLoad, visible }) => {
      const output = getServicesForUser([], [], activeCaseLoad, 12345, [])
      expect(!!output.find(service => service.heading === 'Allocate people, unlock and attend')).toEqual(visible)
    })
  })

  describe('Schedule and edit appointments', () => {
    test.each`
      activeCaseLoad | visible
      ${'LEI'}       | ${true}
      ${'SOM'}       | ${true}
      ${'ELSE'}      | ${false}
    `('caseload: $activeCaseLoad, can see: $visible', ({ activeCaseLoad, visible }) => {
      const output = getServicesForUser([], [], activeCaseLoad, 12345, [])
      expect(!!output.find(service => service.heading === 'Schedule and edit appointments')).toEqual(visible)
    })
  })

  describe('People due to leave', () => {
    test.each`
      activeCaseLoad | visible
      ${'LEI'}       | ${true}
      ${'SOM'}       | ${false}
      ${'LIV'}       | ${false}
      ${'ELSE'}      | ${false}
    `('caseload with activities and appointments enabled, can see: $visible', ({ activeCaseLoad, visible }) => {
      const output = getServicesForUser([], [], activeCaseLoad, 12345, [])
      expect(!!output.find(service => service.heading === 'People due to leave')).toEqual(visible)
    })
  })

  describe('View COVID units', () => {
    test.each`
      roles                | caseLoad | visible
      ${[Role.PrisonUser]} | ${'LEI'} | ${true}
      ${[]}                | ${'LEI'} | ${false}
      ${[Role.PrisonUser]} | ${'LIV'} | ${false}
    `('user with roles and caseload: $roles, can see: $visible', ({ roles, caseLoad, visible }) => {
      const output = getServicesForUser(roles, [], caseLoad, 12345, [])
      expect(!!output.find(service => service.heading === 'View COVID units')).toEqual(visible)
    })
  })

  describe('Historical Prisoner Application', () => {
    test.each`
      roles             | visible
      ${[Role.HpaUser]} | ${true}
      ${[]}             | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Historical Prisoner Application')).toEqual(visible)
    })
  })
  describe('Get someone ready to work', () => {
    test.each`
      roles                                               | visible
      ${[Role.WorkReadinessView, Role.WorkReadinessEdit]} | ${true}
      ${[Role.WorkReadinessEdit]}                         | ${true}
      ${[Role.WorkReadinessView]}                         | ${true}
      ${[]}                                               | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Get someone ready to work')).toEqual(visible)
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
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Manage offences')).toEqual(visible)
    })
  })

  describe('Learning and work progress', () => {
    test.each`
      roles                                                           | visible
      ${[Role.EducationWorkPlanEditor, Role.EducationWorkPlanViewer]} | ${true}
      ${[Role.EducationWorkPlanEditor]}                               | ${true}
      ${[Role.EducationWorkPlanViewer]}                               | ${true}
      ${[]}                                                           | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Learning and work progress')).toEqual(visible)
    })
  })

  describe('Prepare someone for release', () => {
    test.each`
      roles                              | visible
      ${[Role.ResettlementPassportEdit]} | ${true}
      ${[]}                              | ${false}
    `('user with roles: $roles, can see: $visible', ({ roles, visible }) => {
      const output = getServicesForUser(roles, [], 'LEI', 12345, [])
      expect(!!output.find(service => service.heading === 'Prepare someone for release')).toEqual(visible)
    })
  })
})
