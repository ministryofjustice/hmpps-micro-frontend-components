import IndexPage from '../pages'
import Page from '../pages/page'
import DpsSearchPage from '../pages/dpsSearch'
import DpsCaseloadSwitcherPage from '../pages/dpsCaseloadSwitcher'

context('Header', () => {
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

  it('Phase banner visible in header', () => {
    indexPage.header.environmentTag.should('contain.text', 'DEV')
  })

  it('Active caseload switcher visible in header', () => {
    cy.task('stubCaseloadSwitcherPage')

    indexPage.header.caseload.name.should('contain.text', 'Moorland')
    indexPage.header.caseload.button.click()
    Page.verifyOnPage(DpsCaseloadSwitcherPage)
  })

  it('Services menu visible in header', () => {
    indexPage.header.services.menu.should('not.be.visible')
    indexPage.header.services.button.should('contain.text', 'Menu')

    indexPage.header.services.button.click()
    indexPage.header.user.menu.should('not.be.visible')
    indexPage.header.services.menu.should('be.visible')
    indexPage.header.search.menu.should('not.be.visible')
    indexPage.header.services.list.should('have.length', 8)

    indexPage.header.services.button.click()
    indexPage.header.services.menu.should('not.be.visible')
  })

  it('User menu visible in header', () => {
    indexPage.header.user.menu.should('not.be.visible')
    indexPage.header.user.name.should('contain.text', 'J. Doe')

    indexPage.header.user.button.click()
    indexPage.header.user.menu.should('be.visible')
    indexPage.header.services.menu.should('not.be.visible')
    indexPage.header.search.menu.should('not.be.visible')

    indexPage.header.user.signOutLink.should('contain.text', 'Sign out')
    indexPage.header.user.manageDetailsLink.should('contain.text', 'Your account')

    indexPage.header.user.button.click()
    indexPage.header.user.menu.should('not.be.visible')
  })

  it('Search toggle visible in header', () => {
    indexPage.header.search.menu.should('not.be.visible')

    indexPage.header.search.button.click()
    indexPage.header.user.menu.should('not.be.visible')
    indexPage.header.services.menu.should('not.be.visible')
    indexPage.header.search.menu.should('be.visible')

    indexPage.header.search.button.click()
    indexPage.header.search.menu.should('not.be.visible')
  })

  it('Search can be performed', () => {
    indexPage.header.search.button.click()
    indexPage.header.search.menu.should('be.visible')

    indexPage.header.search.input.type('This is a test')

    cy.task('stubSearchPage')

    indexPage.header.search.submit.click()
    Page.verifyOnPage(DpsSearchPage)
    cy.location('search').should('eq', '?keywords=This+is+a+test')
  })
})
