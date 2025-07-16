import config from '../../config'
import { Role, userHasRoles } from './roles'
import { Location } from '../../interfaces/location'
import { Service } from '../../interfaces/Service'
import { ServiceActiveAgencies, ServiceName } from '../../@types/activeAgencies'
import { StaffAllocationPolicies } from '../../data/AllocationsApiClient'

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
    Array.isArray(applicationAgencyConfig.activeAgencies) &&
    (applicationAgencyConfig.activeAgencies[0] === ALL_PRISONS_STRING ||
      applicationAgencyConfig.activeAgencies.includes(activeCaseLoadId))
  )
}

function isActiveInEstablishmentWithLegacyFallback(
  activeCaseLoadId: string,
  service: ServiceName,
  activeServices: ServiceActiveAgencies[] | null,
  legacyConfiguration: string,
): boolean | undefined {
  const legacyFallbackEnabled =
    legacyConfiguration === ALL_PRISONS_STRING || (legacyConfiguration?.split(',').includes(activeCaseLoadId) ?? false)

  return isActiveInEstablishment(activeCaseLoadId, service, activeServices, legacyFallbackEnabled)
}
export default (
  roles: string[],
  isKeyworker: boolean,
  allocationPolicies: StaffAllocationPolicies,
  activeCaseLoadId: string,
  staffId: number,
  locations: Location[],
  activeServices: ServiceActiveAgencies[] | null,
): Service[] => {
  const isActivitiesEnabled = isActiveInEstablishmentWithLegacyFallback(
    activeCaseLoadId,
    ServiceName.ACTIVITIES,
    activeServices,
    config.serviceUrls.activities.enabledPrisons,
  )

  return [
    {
      id: 'global-search',
      heading: 'Global search',
      description: 'Search for someone in any establishment, or who has been released.',
      href: `${config.serviceUrls.dps.url}/global-search`,
      navEnabled: true,
      enabled: () => userHasRoles([Role.GlobalSearch], roles),
    },
    {
      id: 'key-worker-allocations',
      heading: 'My key worker allocation',
      description: 'View your key worker cases.',
      href: `${config.serviceUrls.omic.url}/key-worker/${staffId}`,
      navEnabled: true,
      enabled: () =>
        isKeyworker &&
        !isActiveInEstablishment(activeCaseLoadId, ServiceName.ALLOCATE_KEY_WORKERS, activeServices, false),
    },
    {
      id: 'manage-prisoner-whereabouts',
      heading: 'Prisoner whereabouts',
      description: 'View unlock lists, all appointments, manage attendance and add bulk appointments.',
      href: `${config.serviceUrls.dps.url}/manage-prisoner-whereabouts`,
      navEnabled: true,
      enabled: () =>
        isActiveInEstablishment(activeCaseLoadId, ServiceName.WHEREABOUTS, activeServices, !isActivitiesEnabled),
    },
    {
      id: 'change-someones-cell',
      heading: 'Change someone’s cell',
      description: 'Complete a cell move and view the 7 day history of all cell moves completed in your establishment.',
      href: config.serviceUrls.changeSomeonesCell.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.CellMove], roles),
    },
    {
      id: 'check-my-diary',
      heading: 'Check my diary',
      description: 'View your prison staff detail (staff rota) from home.',
      href: config.serviceUrls.checkMyDiary.url,
      navEnabled: true,
      enabled: () => true,
    },
    {
      id: 'incentives',
      heading: 'Incentives',
      description: 'Manage incentive level reviews by residential location and view incentives data charts.',
      href: config.serviceUrls.incentives.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.MaintainIncentiveLevels], roles) || locations?.length > 0,
    },
    {
      id: 'use-of-force',
      heading: 'Use of force incidents',
      description: 'Manage and view incident reports and statements.',
      href: config.serviceUrls.useOfForce.url,
      navEnabled: true,
      enabled: () => config.serviceUrls.useOfForce.enabledPrisons.split(',').includes(activeCaseLoadId),
    },
    {
      id: 'pathfinder',
      heading: 'Pathfinder',
      description: 'Manage your Pathfinder caseloads.',
      href: config.serviceUrls.pathfinder.url,
      navEnabled: true,
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
      navEnabled: true,
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
      href: config.serviceUrls.establishmentRoll.url,
      navEnabled: true,
      enabled: () => locations?.length > 0,
    },
    {
      id: 'manage-key-workers',
      heading: 'Key workers',
      description: 'Add and remove key workers from prisoners and manage individuals.',
      href: config.serviceUrls.omic.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.OmicAdmin, Role.KeyworkerMonitor], roles) &&
        !isActiveInEstablishment(activeCaseLoadId, ServiceName.ALLOCATE_KEY_WORKERS, activeServices, false),
    },
    {
      id: 'pom',
      heading: 'POM cases',
      description: 'Keep track of your allocations. If you allocate cases, you also can do that here.',
      href: config.serviceUrls.moic.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.AllocationsManager, Role.AllocationsCaseManager], roles),
    },
    {
      id: 'manage-users',
      heading: 'Manage user accounts',
      description:
        'As a Local System Administrator (LSA) or administrator, manage accounts and groups for service users.',
      href: config.serviceUrls.manageAccounts.url,
      navEnabled: true,
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
      navEnabled: true,
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
      navEnabled: true,
      enabled: () => userHasRoles([Role.PecsOca, Role.PecsPrison], roles),
    },
    {
      id: 'soc',
      heading: 'Manage SOC cases',
      description: 'Manage your Serious and Organised Crime (SOC) caseload.',
      href: config.serviceUrls.soc.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.SocCustody, Role.SocCommunity, Role.SocHq], roles),
    },
    {
      id: 'pin-phones',
      heading: 'Prisoner communication monitoring service',
      description: 'Access to the Prisoner communication monitoring service.',
      href: config.serviceUrls.pinPhones.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.PcmsAnalyst, Role.PcmsAuthorisingOfficer, Role.PcmsGlobalAdmin, Role.PcmsAudit], roles),
    },
    {
      id: 'manage-adjudications',
      heading: 'Adjudications',
      description: 'Place a prisoner on report after an incident, view reports and manage adjudications.',
      href: config.serviceUrls.manageAdjudications.url,
      navEnabled: true,
      enabled: () =>
        isActiveInEstablishmentWithLegacyFallback(
          activeCaseLoadId,
          ServiceName.ADJUDICATION,
          activeServices,
          config.serviceUrls.manageAdjudications.enabledPrisons,
        ),
    },
    {
      id: 'book-a-prison-visit',
      heading: 'Manage prison visits',
      description: 'Book, view and cancel a prisoner’s social visits.',
      href: config.serviceUrls.managePrisonVisits.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.ManagePrisonVisits], roles),
    },
    {
      id: 'legacy-prison-visit',
      heading: 'Online visit requests',
      description: 'Respond to online social visit requests.',
      href: config.serviceUrls.legacyPrisonVisits.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.PvbRequests], roles),
    },
    {
      id: 'secure-social-video-calls',
      heading: 'Secure social video calls',
      description:
        'Manage and monitor secure social video calls with prisoners. Opens the Prison Video Calls application.',
      href: config.serviceUrls.secureSocialVideoCalls.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.SocialVideoCalls], roles),
    },
    {
      id: 'check-rule39-mail',
      heading: 'Check Rule 39 mail',
      description: 'Scan barcodes on mail from law firms and other approved senders.',
      href: config.serviceUrls.sendLegalMail.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.SlmScanBarcode, Role.SlmAdmin], roles),
    },
    {
      id: 'welcome-people-into-prison',
      heading: 'Welcome people into prison',
      description:
        'View prisoners booked to arrive today, add them to the establishment roll, and manage reception tasks for recent arrivals.',
      href: config.serviceUrls.welcomePeopleIntoPrison.url,
      navEnabled: true,
      enabled: () => config.serviceUrls.welcomePeopleIntoPrison.enabledPrisons.split(',').includes(activeCaseLoadId),
    },
    {
      id: 'submit-an-intelligence-report',
      heading: 'Submit an Intelligence Report',
      description: 'Access to the new Mercury submission form',
      href: config.serviceUrls.mercurySubmit.url,
      navEnabled: true,
      enabled: () => true,
    },
    {
      id: 'intelligence-management-service',
      heading: 'Intelligence management service',
      description: 'Manage and view intelligence reports',
      href: config.serviceUrls.manageIntelligence.url,
      navEnabled: true,
      enabled: () => config.serviceUrls.manageIntelligence.url && userHasRoles([Role.ManageIntelligenceUser], roles),
    },
    {
      id: 'manage-restricted-patients',
      heading: 'Manage restricted patients',
      description:
        'View your restricted patients, move someone to a secure hospital, or remove someone from the restricted patients service.',
      href: config.serviceUrls.manageRestrictedPatients.url,
      navEnabled: true,
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
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.LicenceCa, Role.LicenceDm, Role.LicenceRo, Role.LicenceAco, Role.LicenceAdmin], roles),
    },
    {
      id: 'activities',
      heading: 'Activities, unlock and attendance',
      description:
        'Create and edit activities. Allocate people and edit allocations. Log applications and manage waitlists. Print unlock lists and record activity attendance.',
      href: `${config.serviceUrls.activities.url}/activities`,
      navEnabled: true,
      enabled: () => isActivitiesEnabled,
    },
    {
      id: 'appointments',
      heading: 'Appointments scheduling and attendance',
      description: 'Create, manage and edit appointments. Print movement slips. Record appointment attendance.',
      href: `${config.serviceUrls.appointments.url}/appointments`,
      navEnabled: true,
      enabled: () => isActivitiesEnabled,
    },
    {
      id: 'view-people-due-to-leave',
      heading: 'People due to leave',
      description: 'View people due to leave this establishment for court appearances, transfers or being released.',
      href: `${config.serviceUrls.dps.url}/manage-prisoner-whereabouts/scheduled-moves`,
      navEnabled: true,
      enabled: () => isActivitiesEnabled,
    },
    {
      id: 'view-covid-units',
      heading: 'View COVID units',
      description: 'View who is in each COVID unit in your establishment.',
      href: `${config.serviceUrls.dps.url}/current-covid-units`,
      navEnabled: true,
      enabled: () => config.app.covidUnitsEnabled && userHasRoles([Role.PrisonUser], roles) && isActivitiesEnabled,
    },
    {
      id: 'historical-prisoner-application',
      heading: 'Historical Prisoner Application',
      description: 'This service allows users to view historical prisoner information.',
      href: config.serviceUrls.historicalPrisonerApplication.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.HpaUser], roles),
    },
    {
      id: 'work-after-leaving-prison',
      heading: 'Work after leaving prison',
      description: 'Manage progress in preparing people for work. Match people to jobs and manage applications.',
      href: `${config.serviceUrls.workAfterLeavingPrison?.url || ''}?sort=releaseDate&order=descending`,
      navEnabled: true,
      enabled: () => userHasRoles([Role.WorkReadinessView, Role.WorkReadinessEdit], roles),
    },
    {
      id: 'manage-offences',
      heading: 'Manage offences',
      description: 'This service allows you to maintain offence reference data.',
      href: config.serviceUrls.manageOffences.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.ManageOffencesAdmin, Role.UpdateOffenceSchedules, Role.NomisOffenceActivator], roles),
    },
    {
      id: 'learning-and-work-progress',
      heading: 'Learning and work progress',
      description: 'View and manage learning and work history, support needs, goals and progress.',
      href: config.serviceUrls.learningAndWorkProgress.url,
      navEnabled: true,
      enabled: () => true,
    },
    {
      id: 'prepare-someone-for-release',
      heading: 'Prepare someone for release',
      description: 'Search for people with resettlement needs. View and manage their information and support.',
      href: config.serviceUrls.prepareSomeoneForReleaseUi.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.ResettlementPassportEdit], roles) &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.PREPARE_SOMEONE_FOR_RELEASE, activeServices, false),
    },
    {
      id: 'cas2',
      heading: 'CAS2 for HDC - short-term accommodation',
      description: 'Apply for accommodation for someone leaving prison on home detention curfew.',
      href: config.serviceUrls.cas2.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.PomUser], roles) &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.CAS2, activeServices, false),
    },
    {
      id: 'cas2-bail',
      heading: 'CAS2 for bail - short-term accommodation',
      description: 'Apply for accommodation and support for someone being bailed from Court or Prison.',
      href: config.serviceUrls.cas2Bail.url,
      navEnabled: true,
      enabled: () => userHasRoles([Role.Cas2PrisonBailReferrer], roles),
    },
    {
      id: 'accredited-programmes',
      heading: 'Accredited Programmes',
      description: 'Search for Accredited Programmes, make referrals and view their progress.',
      href: config.serviceUrls.accreditedProgrammes.url,
      navEnabled: true,
      enabled: () => config.serviceUrls.accreditedProgrammes.enabled,
    },
    {
      id: 'alerts',
      heading: 'Alerts',
      description: 'Alerts API Service',
      href: config.serviceUrls.alerts.url,
      navEnabled: false,
      enabled: () => isActiveInEstablishment(activeCaseLoadId, ServiceName.ALERTS, activeServices, false),
    },
    {
      id: 'caseNotesApi',
      heading: 'Case Notes API',
      description: 'Case Notes API Service',
      href: config.serviceUrls.caseNotesApi.url,
      navEnabled: false,
      enabled: () => isActiveInEstablishment(activeCaseLoadId, ServiceName.CASE_NOTES, activeServices, false),
    },
    {
      id: 'csipUI',
      heading: 'CSIP',
      description: 'View and manage the Challenge, Support and Intervention Plan (CSIP) caseload.',
      href: config.serviceUrls.csipUI.url,
      navEnabled: true,
      enabled: () => isActiveInEstablishment(activeCaseLoadId, ServiceName.CSIP, activeServices, false),
    },
    {
      id: 'residential-locations',
      heading: 'Residential locations',
      description: 'View and manage residential locations in the establishment.',
      href: config.serviceUrls.residentialLocations.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.ViewLocation, Role.ChangeLocation, Role.ManageResidentialLocations], roles) &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.RESIDENTIAL_LOCATIONS, activeServices, false),
    },
    {
      id: 'reporting',
      heading: 'Reporting',
      description: 'Digital Prison Reporting - Find and view reports.',
      href: config.serviceUrls.reporting.url,
      navEnabled: true,
      enabled: () =>
        isActiveInEstablishmentWithLegacyFallback(
          activeCaseLoadId,
          ServiceName.REPORTING,
          activeServices,
          config.serviceUrls.reporting.enabledPrisons,
        ),
    },
    {
      id: 'incident-reporting',
      heading: 'Incident reporting',
      description: 'View, create and edit incident reports.',
      href: config.serviceUrls.incidentReporting.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.IncidentReportingRO, Role.IncidentReportingRW, Role.IncidentReportingApprove], roles) &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.INCIDENT_REPORTING, activeServices, false),
    },
    {
      id: 'manage-applications',
      heading: 'Applications',
      description: 'Log, action and reply to prisoner applications.',
      href: config.serviceUrls.manageApplications.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.PrisonUser], roles) &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.MANAGE_APPLICATIONS, activeServices, false),
    },
    {
      id: 'dietary-requirements',
      heading: 'Dietary requirements',
      description: 'View prisoner food allergies, medical dietary requirements, and personal dietary needs.',
      href: `${config.serviceUrls.newDps.url}/dietary-requirements`,
      navEnabled: true,
      enabled: () => userHasRoles([Role.DietAndAllergiesReport], roles),
    },
    {
      id: 'create-an-electronic-monitoring-order',
      heading: 'Apply, change or end an Electronic Monitoring Order (EMO)',
      description: '',
      href: config.serviceUrls.createAnEMOrder.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.CreateAnEMOrder], roles) &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.CEMO, activeServices, false),
    },
    {
      id: 'allocate-key-workers',
      heading: 'Key workers',
      description: 'Allocate key workers to prisoners and manage key work in your establishment.',
      href: config.serviceUrls.allocateKeyWorkers.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.OmicAdmin, Role.KeyworkerMonitor], roles) &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.ALLOCATE_KEY_WORKERS, activeServices, false),
    },
    {
      id: 'my-key-worker-allocations',
      heading: 'My key worker allocations',
      description: 'View your key worker allocations and personal statistics.',
      href: `${config.serviceUrls.allocateKeyWorkers.url}/staff-profile/${staffId}`,
      navEnabled: true,
      enabled: () =>
        allocationPolicies.policies.includes('KEY_WORKER') &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.ALLOCATE_KEY_WORKERS, activeServices, false),
    },
    {
      id: 'allocate-personal-officers',
      heading: 'Personal officers',
      description: 'Allocate personal officers to prisoners and manage officer work in your establishment.',
      href: config.serviceUrls.allocatePersonalOfficers.url,
      navEnabled: true,
      enabled: () =>
        userHasRoles([Role.PersonalOfficerView, Role.PersonalOfficerAllocate], roles) &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.ALLOCATE_PERSONAL_OFFICERS, activeServices, false),
    },
    {
      id: 'my-personal-officer-allocations',
      heading: 'My personal officer allocations',
      description: 'View your personal officer allocations and personal statistics.',
      href: `${config.serviceUrls.allocatePersonalOfficers.url}/staff-profile/${staffId}`,
      navEnabled: true,
      enabled: () =>
        allocationPolicies.policies.includes('PERSONAL_OFFICER') &&
        isActiveInEstablishment(activeCaseLoadId, ServiceName.ALLOCATE_PERSONAL_OFFICERS, activeServices, false),
    },
  ]
    .filter(service => service.enabled())
    .map(service => {
      const { id, heading, description, href, navEnabled } = service
      return { id, heading, description, href, navEnabled }
    })
    .sort((a, b) => (a.heading.toLowerCase() < b.heading.toLowerCase() ? -1 : 1))
}
