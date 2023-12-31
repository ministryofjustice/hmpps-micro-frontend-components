import { CaseLoad } from '../server/interfaces/caseLoad'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
       * @example cy.signIn({ failOnStatusCode: boolean })
       */
      signIn(options?: { failOnStatusCode: boolean }): Chainable<AUTWindow>

      setupUserAuth(options?: {
        roles?: string[]
        caseLoads?: CaseLoad[]
        activeCaseLoadId?: string
        locations?: Location[]
      }): Chainable<AUTWindow>
    }
  }
}
