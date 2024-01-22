import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('This site is under construction...')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=connect-dps-common-header-user-name]')

  headerPhaseBanner = (): PageElement => cy.get('[data-qa=connect-dps-common-environment-tag]')

  caseloadSwitcher = (): PageElement => cy.get('[data-qa=connect-dps-caseload-switcher]')

  servicesMenuToggle = (): PageElement => cy.get('[data-qa=connect-dps-common-service-menu-toggle]')

  searchToggle = (): PageElement => cy.get('[data-qa=connect-dps-common-search-toggle]')
}
