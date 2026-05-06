import { hmppsUserMock, prisonUserMock } from '../../tests/mocks/hmppsUserMock'
import { ContentSecurityPolicyService } from './contentSecurityPolicyService'

describe('Content Security Policy service', () => {
  it.each([
    { scenario: 'probation users', user: hmppsUserMock },
    { scenario: 'undefined users', user: undefined },
  ])('should return minimal necessary directives for $scenario', ({ user }) => {
    const service = new ContentSecurityPolicyService()
    expect(service.getDirectivesForUser(user)).toEqual(
      expect.objectContaining({
        'font-src': expect.arrayContaining(['http://localhost:3000']),
        'img-src': expect.arrayContaining(['http://localhost:3000']),
        'script-src': expect.arrayContaining(['http://localhost:3000']),
        'style-src': expect.arrayContaining(['http://localhost:3000']),
      }),
    )
  })

  it('should return complete set of directives for prison users', () => {
    const service = new ContentSecurityPolicyService()
    expect(service.getDirectivesForUser(prisonUserMock)).toEqual(
      expect.objectContaining({
        'font-src': expect.arrayContaining(['http://localhost:3000']),
        'form-action': expect.arrayContaining(['http://localhost:3001', 'http://localhost:3002']),
        'img-src': expect.arrayContaining(['http://localhost:3000']),
        'script-src': expect.arrayContaining(['http://localhost:3000']),
        'style-src': expect.arrayContaining(['http://localhost:3000']),
      }),
    )
  })
})
