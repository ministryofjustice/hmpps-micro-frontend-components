import { HmppsUser, PrisonUser } from '../../server/interfaces/hmppsUser'
import { Role } from '../../server/services/utils/roles'
import { CaseLoad } from '../../server/interfaces/caseLoad'
import { Service } from '../../server/interfaces/Service'

export const servicesMock: Service[] = [
  {
    id: 'check-my-diary',
    heading: 'Check my diary',
    description: 'View your prison staff detail (staff rota) from home.',
    href: 'http://localhost:3001',
    navEnabled: true,
  },
  {
    id: 'learning-and-work-progress',
    heading: 'Learning and work progress',
    description: 'View and manage learning and work history, support needs, goals and progress.',
    href: 'https://learning-and-work-progress-dev.hmpps.service.justice.gov.uk',
    navEnabled: true,
  },
  {
    id: 'key-worker-allocations',
    heading: 'My key worker allocation',
    description: 'View your key worker cases.',
    href: 'http://localhost:3001/key-worker/111111',
    navEnabled: true,
  },
  {
    id: 'pathfinder',
    heading: 'Pathfinder',
    description: 'Manage your Pathfinder caseloads.',
    href: 'http://localhost:3001',
    navEnabled: true,
  },
  {
    id: 'manage-prisoner-whereabouts',
    heading: 'Prisoner whereabouts',
    description: 'View unlock lists, all appointments, manage attendance and add bulk appointments.',
    href: 'http://localhost:3001/manage-prisoner-whereabouts',
    navEnabled: true,
  },
  {
    id: 'submit-an-intelligence-report',
    heading: 'Submit an Intelligence Report',
    description: 'Submit an intelligence report',
    href: 'http://localhost:3001',
    navEnabled: true,
  },
]

export const activeCaseLoadMock: CaseLoad = {
  caseLoadId: 'LEI',
  description: 'Leeds',
  type: '',
  caseloadFunction: '',
  currentlyActive: true,
}

export const prisonUserMock: PrisonUser = {
  authSource: 'nomis',
  username: 'PRISON_USER',
  userId: '11111',
  name: 'Prison User',
  displayName: 'P. User',
  userRoles: [Role.PathfinderStdPrison],
  token: 'abc.def.ghi',
  staffId: 111111,
  caseLoads: [activeCaseLoadMock],
  activeCaseLoad: activeCaseLoadMock,
  services: servicesMock,
  allocationJobResponsibilities: [],
}

export const hmppsUserMock: HmppsUser = {
  authSource: 'delius',
  username: 'HMPPS_USER',
  userId: '11111',
  name: 'Hmpps User',
  displayName: 'H. User',
  userRoles: [Role.GlobalSearch],
  token: 'token',
}
