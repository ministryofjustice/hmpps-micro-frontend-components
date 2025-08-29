import IndexPage from '../pages'
import Page from '../pages/page'
import DpsSearchPage from '../pages/dpsSearch'
import DpsCaseloadSwitcherPage from '../pages/dpsCaseloadSwitcher'

context('Header', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubCaseloads')
    cy.task('stubLocations')
    cy.task('stubKeyworkerRoles')
    cy.task('stubSearchPage')
    cy.task('stubCaseloadSwitcherPage')
    cy.task('stubGetStaffAllocationPolicies')
  })

  it('Phase banner visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.header.headerPhaseBanner().should('contain.text', 'DEV')
  })

  it('Active caseload switcher visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.header.caseloadSwitcher().should('contain.text', 'Moorland')
    indexPage.header.caseloadSwitcher().click()
    Page.verifyOnPage(DpsCaseloadSwitcherPage)
  })

  it('Services menu visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)

    indexPage.header.services.menu().should('not.be.visible')
    indexPage.header.services.toggle().should('contain.text', 'Menu')

    indexPage.header.services.toggle().click()
    indexPage.header.services.menu().should('be.visible')
    indexPage.header.services.list().should('have.length', 9)

    indexPage.header.services.toggle().click()
    indexPage.header.services.menu().should('not.be.visible')
  })

  it('User menu visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.header.user.toggle().should('be.visible')
    indexPage.header.user.name().should('contain.text', 'J. Doe')

    indexPage.header.user.menu().should('not.be.visible')
    indexPage.header.user.toggle().click()
    indexPage.header.user.menu().should('be.visible')
    indexPage.header.user.signOutLink().should('contain.text', 'Sign out')
    indexPage.header.user.manageDetailsLink().should('contain.text', 'Your account')

    indexPage.header.user.toggle().click()
    indexPage.header.user.menu().should('not.be.visible')
  })

  it('Search toggle visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.header.search.toggle().should('be.visible')
    indexPage.header.search.menu().should('not.be.visible')

    indexPage.header.search.toggle().click()
    indexPage.header.search.menu().should('be.visible')

    indexPage.header.search.toggle().click()
    indexPage.header.search.menu().should('not.be.visible')
  })

  it('Search can be performed', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.header.search.toggle().should('be.visible')
    indexPage.header.search.menu().should('not.be.visible')

    indexPage.header.search.toggle().click()
    indexPage.header.search.menu().should('be.visible')

    indexPage.header.search.input().type('This is a test')
    indexPage.header.search.submit().click()
    Page.verifyOnPage(DpsSearchPage)
    cy.location('search').should('eq', '?keywords=This+is%20a%20test')
  })
})
