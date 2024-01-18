import config from '../../config'
import { Role, userHasRoles } from './roles'
import { Location } from '../../interfaces/location'
import { Service } from '../../interfaces/Service'
import { ServiceActiveAgencies, ServiceName } from '../../@types/activeAgencies'

const ALL_PRISONS_STRING = '***'

function isActiveInEstablishment(
  activeCaseLoadId: string,
  service: ServiceName,
  activeServices: ServiceActiveAgencies[] | null,
  fallback: boolean,
): boolean | undefined {
  if (!activeServices) return fallback // no stored data
  const applicationAgencyConfig = activeServices.find(activeService => activeService.app === service)
  if (!applicationAgencyConfig) return fallback // no stored data for this service

  return (
    applicationAgencyConfig.activeAgencies[0] === ALL_PRISONS_STRING ||
    applicationAgencyConfig.activeAgencies.includes(activeCaseLoadId)
  )
}

export default (
  roles: string[],
  isKeywoker: boolean,
  activeCaseLoadId: string,
  staffId: number,
  locations: Location[],
  activeServices: ServiceActiveAgencies[] | null,
): Service[] => {
  const isActivitiesEnabled = isActiveInEstablishment(
    activeCaseLoadId,
    ServiceName.ACTIVITIES,
    activeServices,
    config.serviceUrls.activities.enabledPrisons.split(',').includes(activeCaseLoadId),
  )

  return [
    {
      id: 'global-search',
      heading: 'Global search',
      description: 'Search for someone in any establishment, or who has been released.',
      href: `${config.serviceUrls.dps.url}/global-search`,
      enabled: () => userHasRoles([Role.GlobalSearch], roles),
    },
    {
      id: 'key-worker-allocations',
      heading: 'My key worker allocation',
      description: 'View your key worker cases.',
      href: `${config.serviceUrls.omic.url}/key-worker/${staffId}`,
      enabled: () => isKeywoker,
    },
    {
      id: 'manage-prisoner-whereabouts',
      heading: 'Prisoner whereabouts',
      description: 'View unlock lists, all appointments, manage attendance and add bulk appointments.',
      href: `${config.serviceUrls.dps.url}/manage-prisoner-whereabouts`,
      enabled: () => !isActivitiesEnabled,
    },
    {
      id: 'change-someones-cell',
      heading: 'Change someone’s cell',
      description: 'Complete a cell move and view the 7 day history of all cell moves completed in your establishment.',
      href: `${config.serviceUrls.dps.url}/change-someones-cell`,
      enabled: () => userHasRoles([Role.CellMove], roles),
    },
    {
      id: 'check-my-diary',
      heading: 'Check my diary',
      description: 'View your prison staff detail (staff rota) from home.',
      href: config.serviceUrls.checkMyDiary.url,
      enabled: () => true,
    },
    {
      id: 'incentives',
      heading: 'Incentives',
      description: 'Manage incentive level reviews by residential location and view incentives data charts.',
      href: config.serviceUrls.incentives.url,
      enabled: () => userHasRoles([Role.MaintainIncentiveLevels], roles) || locations?.length > 0,
    },
    {
      id: 'use-of-force',
      heading: 'Use of force incidents',
      description: 'Manage and view incident reports and statements.',
      href: config.serviceUrls.useOfForce.url,
      enabled: () => config.serviceUrls.useOfForce.enabledPrisons.split(',').includes(activeCaseLoadId),
    },
    {
      id: 'pathfinder',
      heading: 'Pathfinder',
      description: 'Manage your Pathfinder caseloads.',
      href: config.serviceUrls.pathfinder.url,
      enabled: () =>
        config.serviceUrls.pathfinder.url &&
        userHasRoles(
          [
            Role.PathfinderAdmin,
            Role.PathfinderUser,
            Role.PathfinderStdPrison,
            Role.PathfinderStdProbation,
            Role.PathfinderApproval,
            Role.PathfinderStdPrisonRo,
            Role.PathfinderStdProbationRo,
            Role.PathfinderPolice,
            Role.PathfinderHQ,
            Role.PathfinderPsychologist,
            Role.PathfinderNationalReader,
            Role.PathfinderLocalReader,
          ],
          roles,
        ),
    },
    {
      id: 'hdc-licences',
      heading: 'Home Detention Curfew',
      description: 'Create and manage Home Detention Curfew.',
      href: config.serviceUrls.licences.url,
      enabled: () =>
        userHasRoles(
          [Role.NomisBatchload, Role.LicenceCa, Role.LicenceDm, Role.LicenceRo, Role.LicenceVary, Role.LicenceReadOnly],
          roles,
        ),
    },
    {
      id: 'establishment-roll',
      heading: 'Establishment roll check',
      description: 'View the roll broken down by residential unit and see who is arriving and leaving.',
      href: `${config.serviceUrls.dps.url}/establishment-roll`,
      enabled: () => locations?.length > 0,
    },
    {
      id: 'manage-key-workers',
      heading: 'Key workers',
      description: 'Add and remove key workers from prisoners and manage individuals.',
      href: config.serviceUrls.omic.url,
      enabled: () => userHasRoles([Role.OmicAdmin, Role.KeyworkerMonitor], roles),
    },
    {
      id: 'pom',
      heading: 'POM cases',
      description: 'Keep track of your allocations. If you allocate cases, you also can do that here.',
      href: config.serviceUrls.moic.url,
      enabled: () => userHasRoles([Role.AllocationsManager, Role.AllocationsCaseManager], roles),
    },
    {
      id: 'manage-users',
      heading: 'Manage user accounts',
      description:
        'As a Local System Administrator (LSA) or administrator, manage accounts and groups for service users.',
      href: config.serviceUrls.manageAccounts.url,
      enabled: () =>
        userHasRoles(
          [Role.MaintainAccessRoles, Role.MaintainAccessRolesAdmin, Role.MaintainOauthUsers, Role.AuthGroupManager],
          roles,
        ),
    },
    {
      id: 'categorisation',
      heading: 'Categorisation',
      description: 'View a prisoner’s category and complete either a first time categorisation or a recategorisation.',
      href: config.serviceUrls.categorisation.url,
      enabled: () =>
        userHasRoles(
          [
            Role.CreateCategorisation,
            Role.CreateRecategorisation,
            Role.ApproveCategorisation,
            Role.CategorisationSecurity,
          ],
          roles,
        ),
    },
    {
      id: 'secure-move',
      heading: 'Book a secure move',
      description:
        'Schedule secure movement for prisoners in custody, via approved transport suppliers, between locations across England and Wales.',
      href: config.serviceUrls.pecs.url,
      enabled: () => userHasRoles([Role.PecsOca, Role.PecsPrison], roles),
    },
    {
      id: 'soc',
      heading: 'Manage SOC cases',
      description: 'Manage your Serious and Organised Crime (SOC) caseload.',
      href: config.serviceUrls.soc.url,
      enabled: () => userHasRoles([Role.SocCustody, Role.SocCommunity, Role.SocHq], roles),
    },
    {
      id: 'pin-phones',
      heading: 'Prisoner communication monitoring service',
      description: 'Access to the Prisoner communication monitoring service.',
      href: config.serviceUrls.pinPhones.url,
      enabled: () =>
        userHasRoles([Role.PcmsAnalyst, Role.PcmsAuthorisingOfficer, Role.PcmsGlobalAdmin, Role.PcmsAudit], roles),
    },
    {
      id: 'manage-adjudications',
      heading: 'Adjudications',
      description: 'Place a prisoner on report after an incident, view reports and manage adjudications.',
      href: config.serviceUrls.manageAdjudications.url,
      enabled: () =>
        isActiveInEstablishment(
          activeCaseLoadId,
          ServiceName.ADJUDICATION,
          activeServices,
          config.serviceUrls.manageAdjudications.enabledPrisons.split(',').includes(activeCaseLoadId),
        ),
    },
    {
      id: 'book-a-prison-visit',
      heading: 'Manage prison visits',
      description: 'Book, view and cancel a prisoner’s social visits.',
      href: config.serviceUrls.managePrisonVisits.url,
      enabled: () => userHasRoles([Role.ManagePrisonVisits], roles),
    },
    {
      id: 'legacy-prison-visit',
      heading: 'Online visit requests',
      description: 'Respond to online social visit requests.',
      href: config.serviceUrls.legacyPrisonVisits.url,
      enabled: () => userHasRoles([Role.PvbRequests], roles),
    },
    {
      id: 'secure-social-video-calls',
      heading: 'Secure social video calls',
      description:
        'Manage and monitor secure social video calls with prisoners. Opens the Prison Video Calls application.',
      href: config.serviceUrls.secureSocialVideoCalls.url,
      enabled: () => userHasRoles([Role.SocialVideoCalls], roles),
    },
    {
      id: 'check-rule39-mail',
      heading: 'Check Rule 39 mail',
      description: 'Scan barcodes on mail from law firms and other approved senders.',
      href: config.serviceUrls.sendLegalMail.url,
      enabled: () => userHasRoles([Role.SlmScanBarcode, Role.SlmAdmin], roles),
    },
    {
      id: 'welcome-people-into-prison',
      heading: 'Welcome people into prison',
      description:
        'View prisoners booked to arrive today, add them to the establishment roll, and manage reception tasks for recent arrivals.',
      href: config.serviceUrls.welcomePeopleIntoPrison.url,
      enabled: () => config.serviceUrls.welcomePeopleIntoPrison.enabledPrisons.split(',').includes(activeCaseLoadId),
    },
    {
      id: 'submit-an-intelligence-report',
      heading: 'Submit an Intelligence Report',
      description: 'Access to the new Mercury submission form',
      href: config.serviceUrls.mercurySubmit.url,
      enabled: () => true,
    },
    {
      id: 'intelligence-management-service',
      heading: 'Intelligence Management Service',
      description: 'Manage and view intelligence reports',
      href: config.serviceUrls.manageIntelligence.url,
      enabled: () => config.serviceUrls.manageIntelligence.url && userHasRoles([Role.ManageIntelligenceUser], roles),
    },
    {
      id: 'manage-restricted-patients',
      heading: 'Manage restricted patients',
      description:
        'View your restricted patients, move someone to a secure hospital, or remove someone from the restricted patients service.',
      href: config.serviceUrls.manageRestrictedPatients.url,
      enabled: () =>
        userHasRoles(
          [
            Role.SearchRestrictedPatient,
            Role.TransferRestrictedPatient,
            Role.RemoveRestrictedPatient,
            Role.RestrictedPatientMigration,
          ],
          roles,
        ),
    },
    {
      id: 'create-and-vary-a-licence',
      heading: 'Create and vary a licence',
      description: 'Create and vary standard determinate licences and post sentence supervision orders.',
      href: config.serviceUrls.createAndVaryALicence.url,
      enabled: () =>
        userHasRoles([Role.LicenceCa, Role.LicenceDm, Role.LicenceRo, Role.LicenceAco, Role.LicenceAdmin], roles),
    },
    {
      id: 'activities',
      heading: 'Allocate people, unlock and attend',
      description:
        'Create and edit activities. Log applications and manage waitlists. Allocate people and edit allocations. Print unlock lists and record attendance.',
      href: `${config.serviceUrls.activities.url}/activities`,
      enabled: () => isActivitiesEnabled,
    },
    {
      id: 'appointments',
      heading: 'Schedule and edit appointments',
      description: 'Create and manage appointments. Print movement slips.',
      href: `${config.serviceUrls.appointments.url}/appointments`,
      enabled: () => isActivitiesEnabled,
    },
    {
      id: 'view-people-due-to-leave',
      heading: 'People due to leave',
      description: 'View people due to leave this establishment for court appearances, transfers or being released.',
      href: `${config.serviceUrls.dps.url}/manage-prisoner-whereabouts/scheduled-moves`,
      enabled: () => isActivitiesEnabled,
    },
    {
      id: 'view-covid-units',
      heading: 'View COVID units',
      description: 'View who is in each COVID unit in your establishment.',
      href: `${config.serviceUrls.dps.url}/current-covid-units`,
      enabled: () => config.app.covidUnitsEnabled && userHasRoles([Role.PrisonUser], roles) && isActivitiesEnabled,
    },
    {
      id: 'historical-prisoner-application',
      heading: 'Historical Prisoner Application',
      description: 'This service allows users to view historical prisoner information.',
      href: config.serviceUrls.historicalPrisonerApplication.url,
      enabled: () => userHasRoles([Role.HpaUser], roles),
    },
    {
      id: 'get-someone-ready-to-work',
      heading: 'Get someone ready to work',
      description: 'Record what support a prisoner needs to get work. View who has been assessed as ready to work.',
      href: `${config.serviceUrls.getSomeoneReadyForWork.url}?sort=releaseDate&order=descending`,
      enabled: () => userHasRoles([Role.WorkReadinessView, Role.WorkReadinessEdit], roles),
    },
    {
      id: 'manage-offences',
      heading: 'Manage offences',
      description: 'This service allows you to maintain offence reference data.',
      href: config.serviceUrls.manageOffences.url,
      enabled: () =>
        userHasRoles([Role.ManageOffencesAdmin, Role.UpdateOffenceSchedules, Role.NomisOffenceActivator], roles),
    },
    {
      id: 'learning-and-work-progress',
      heading: 'Learning and work progress',
      description: 'View and manage learning and work history, support needs, goals and progress.',
      href: config.serviceUrls.learningAndWorkProgress.url,
      enabled: () => userHasRoles([Role.EducationWorkPlanEditor, Role.EducationWorkPlanViewer], roles),
    },
    {
      id: 'prepare-someone-for-release',
      heading: 'Prepare someone for release',
      description: 'Search for people with resettlement needs. View and manage their information and support.',
      href: config.serviceUrls.prepareSomeoneForRelease.url,
      enabled: () => userHasRoles([Role.ResettlementPassportEdit], roles),
    },
  ]
    .filter(service => service.enabled())
    .map(service => {
      const { id, heading, description, href } = service
      return { id, heading, description, href }
    })
    .sort((a, b) => (a.heading < b.heading ? -1 : 1))
}
