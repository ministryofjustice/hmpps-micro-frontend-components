import Page, { type PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('This site is under construction...')
  }

  header = {
    get environmentTag(): PageElement {
      return cy.get('[data-qa="cdps-header-environment-tag"]')
    },

    caseload: {
      get button(): PageElement<HTMLAnchorElement> {
        return cy.get('[data-qa="cdps-header-caseload"]')
      },

      get name(): PageElement<HTMLSpanElement> {
        return cy.get('[data-qa="cdps-header-caseload-name"]')
      },
    },

    user: {
      get button(): PageElement<HTMLAnchorElement> {
        return cy.get('[data-qa="cdps-header-user"]')
      },

      get name(): PageElement<HTMLSpanElement> {
        return cy.get('[data-qa="cdps-header-user-name"]')
      },

      get menu(): PageElement<HTMLDivElement> {
        return cy.get('#cdps-header__menu--user')
      },

      get signOutLink(): PageElement<HTMLAnchorElement> {
        return this.menu.find('a[href="/sign-out"]')
      },

      get manageDetailsLink(): PageElement<HTMLAnchorElement> {
        return this.menu.find('a[href="http://localhost:9091/auth/account-details"]')
      },
    },

    services: {
      get button(): PageElement<HTMLAnchorElement> {
        return cy.get('[data-qa="cdps-header-services"]')
      },

      get menu(): PageElement<HTMLDivElement> {
        return cy.get('#cdps-header__menu--services')
      },

      get list(): PageElement<HTMLLIElement> {
        return this.menu.find('li')
      },
    },

    search: {
      get button(): PageElement<HTMLAnchorElement> {
        return cy.get('[data-qa="cdps-header-search"]')
      },

      get menu(): PageElement<HTMLDivElement> {
        return cy.get('#cdps-header__menu--search')
      },

      get input(): PageElement<HTMLInputElement> {
        return this.menu.find('input')
      },

      get submit(): PageElement<HTMLButtonElement> {
        return this.menu.find('button')
      },
    },
  }

  footer = {
    services: {
      get list(): PageElement<HTMLLIElement> {
        return cy.get('#connect-dps-common-footer-services ul li')
      },
    },

    supportLinks: {
      get list() {
        return cy.get('.connect-dps-common-footer__support-links')
      },

      get feedbackSurveyLink(): PageElement<HTMLAnchorElement> {
        return this.list.find('a[href="https://www.smartsurvey.co.uk/s/43EWY0/"]')
      },

      get accessibilityLink(): PageElement<HTMLAnchorElement> {
        return this.list.find('a[href="http://localhost:9091/new-dps/accessibility-statement"]')
      },

      get termsAndConditionsLink(): PageElement<HTMLAnchorElement> {
        return this.list.find('a[href="http://localhost:9091/new-dps/terms-and-conditions"]')
      },

      get privacyPolicyLink(): PageElement<HTMLAnchorElement> {
        return this.list.find('a[href="http://localhost:9091/new-dps/privacy-policy"]')
      },

      get cookiesPolicyLink(): PageElement<HTMLAnchorElement> {
        return this.list.find('a[href="http://localhost:9091/new-dps/cookies-policy"]')
      },
    },
  }
}
