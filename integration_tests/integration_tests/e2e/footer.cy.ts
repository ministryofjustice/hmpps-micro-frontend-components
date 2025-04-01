import IndexPage from '../pages'
import Page from '../pages/page'

context('Footer', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubCaseloads')
    cy.task('stubLocations')
    cy.task('stubKeyworkerRoles')
  })

  it('Services menu visible in footer', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)

    indexPage.footer.services.list().should('have.length', 8)
  })

  it('Links should be displayed', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.footer.feedbackSurveyLink().should('be.visible')
    indexPage.footer.accessibilityLink().should('be.visible')
    indexPage.footer.termsAndConditionsLink().should('be.visible')
    indexPage.footer.privacyPolicyLink().should('be.visible')
    indexPage.footer.cookiesPolicyLink().should('be.visible')
  })
})
