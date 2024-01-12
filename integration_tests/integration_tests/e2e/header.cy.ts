import IndexPage from '../pages'
import Page from '../pages/page'

context('Header', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubCaseloads')
    cy.task('stubLocations')
    cy.task('stubKeyworkerRoles')
  })

  it('User name visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerUserName().should('contain.text', 'J. Doe')
  })

  it('Phase banner visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerPhaseBanner().should('contain.text', 'DEV')
  })

  it('Active caseload visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.caseloadSwitcher().should('contain.text', 'Moorland')
  })

  it('Services menu visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.servicesMenuToggle().should('contain.text', 'Menu')
  })

  it('Search toggle visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.searchToggle().should('be.visible')
  })
})
