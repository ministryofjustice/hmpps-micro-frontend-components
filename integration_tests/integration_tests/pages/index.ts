import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('This site is under construction...')
  }

  header = {
    headerPhaseBanner: (): PageElement => cy.get('[data-qa=connect-dps-common-environment-tag]'),

    caseloadSwitcher: (): PageElement => cy.get('[data-qa=connect-dps-caseload-switcher]'),

    user: {
      name: (): PageElement => cy.get('[data-qa=connect-dps-common-header-user-name]'),
      toggle: (): PageElement => this.header.user.name().parent(),
      menu: (): PageElement => cy.get('#connect-dps-common-header-user-menu'),
      signOutLink: (): PageElement => cy.get('#connect-dps-common-header-user-menu').find('a[href="/sign-out"]'),
      manageDetailsLink: (): PageElement =>
        cy.get('#connect-dps-common-header-user-menu').find('a[href="http://localhost:9091/auth/account-details"]'),
    },

    services: {
      toggle: (): PageElement => cy.get('[data-qa=connect-dps-common-service-menu-toggle]'),
      menu: (): PageElement => cy.get('#connect-dps-common-header-services-menu'),
      list: (): PageElement => cy.get('#connect-dps-common-header-services-menu ul li'),
    },

    search: {
      toggle: (): PageElement => cy.get('[data-qa=connect-dps-common-search-toggle]'),
      menu: (): PageElement => cy.get('#connect-dps-common-header-search-menu'),
      input: (): PageElement => cy.get('#connect-dps-common-header-prisoner-search'),
      submit: (): PageElement => cy.get('.connect-dps-common-header__search-menu-submit-btn'),
    },
  }

  footer = {
    services: {
      list: (): PageElement => cy.get('#connect-dps-common-footer-services ul li'),
    },

    feedbackSurveyLink: (): PageElement => cy.get('a[href="https://www.smartsurvey.co.uk/s/43EWY0/"]'),
    accessibilityLink: (): PageElement => cy.get('a[href="https://external/new-dps/accessibility-statement"]'),
    termsAndConditionsLink: (): PageElement => cy.get('a[href="https://external/new-dps/terms-and-conditions"]'),
    privacyPolicyLink: (): PageElement => cy.get('a[href="https://external/new-dps/privacy-policy"]'),
    cookiesPolicyLink: (): PageElement => cy.get('a[href="https://external/new-dps/cookies-policy"]'),
  }
}
