import IndexPage from '../pages'
import Page from '../pages/page'

context('Footer', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubExampleTime')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubCaseloads')
    cy.task('stubLocations')
    cy.task('stubGetStaffAllocationPolicies')
  })

  let indexPage: IndexPage
  beforeEach(() => {
    cy.signIn()
    indexPage = Page.verifyOnPage(IndexPage)
  })

  it('Services menu visible in footer', () => {
    indexPage.footer.services.list.should('have.length', 8)
  })

  it('Links should be displayed', () => {
    indexPage.footer.supportLinks.feedbackSurveyLink.should('be.visible')
    indexPage.footer.supportLinks.accessibilityLink.should('be.visible')
    indexPage.footer.supportLinks.termsAndConditionsLink.should('be.visible')
    indexPage.footer.supportLinks.privacyPolicyLink.should('be.visible')
    indexPage.footer.supportLinks.cookiesPolicyLink.should('be.visible')
  })
})
