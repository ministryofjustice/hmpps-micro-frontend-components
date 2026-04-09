/*
 * NB: These interfaces are exposed to clients of this service so care must be taken with any changes!
 * Make sure to reflect any changes in swagger comments in /server/routes/componentRoutes.ts
 */

/**
 * Names of currently available components
 */
export type AvailableComponent = 'header' | 'footer'

/**
 * Rendered requested components and prison user meta information
 */
export type Components<C extends AvailableComponent = AvailableComponent> = Record<C, Component> & {
  meta: SharedData
}

/**
 * A rendered component
 */
export interface Component {
  /** HTML that clients should insert into their pages */
  html: string
  /** Links to stylesheets that clients should add into their pages */
  css: string[]
  /** Links to scripts that clients should add into their pages */
  javascript: string[]
}

/**
 * Information about the current user and environment
 */
export interface SharedData {
  /** Caseloads available to prison user */
  caseLoads: CaseLoad[]
  /** Currently active caseload for prison user */
  activeCaseLoad: CaseLoad | null
  /** Services available to prison user */
  services: Service[]
  /** Prison user allocated responsibilites */
  allocationJobResponsibilities: ('KEY_WORKER' | 'PERSONAL_OFFICER')[]
}

/**
 * Details of a service accessible by a prison user
 */
export interface Service {
  id: string
  heading: string
  description: string
  href: string
  navEnabled: boolean
}

/**
 * Details of a prison user’s caseload
 */
export interface CaseLoad {
  caseLoadId: string
  description: string
  type: string
  caseloadFunction: string
  currentlyActive: boolean
}
