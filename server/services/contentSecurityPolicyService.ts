import config from '../config'
import { type HmppsUser, isPrisonUser } from '../interfaces/hmppsUser'

export type CspDirectives = Record<string, string[]>

export class ContentSecurityPolicyService {
  getDirectivesForUser(user: HmppsUser): CspDirectives {
    const directives = this.minimalNecessaryDirectives()
    if (isPrisonUser(user)) {
      this.mergeDirectives(directives, this.directivesForDpsHeader())
    }
    return directives
  }

  /** CSP directives to load all components’ styles and scripts */
  private minimalNecessaryDirectives(): CspDirectives {
    return {
      'font-src': [config.ingressUrl],
      'img-src': [config.ingressUrl],
      'script-src': [config.ingressUrl],
      'style-src': [config.ingressUrl],
    }
  }

  /** CSP directives allow DPS header to submit prisoner search form */
  private directivesForDpsHeader(): CspDirectives {
    return {
      'form-action': [config.serviceUrls.newDps.url, config.serviceUrls.oldDps.url],
    }
  }

  private mergeDirectives(directives: CspDirectives, overrides: Readonly<CspDirectives>): void {
    Object.entries(overrides).forEach(([directive, values]) => {
      if (directive in directives) {
        values.forEach(value => {
          if (!directives[directive].includes(value)) {
            directives[directive].push(value)
          }
        })
      } else {
        // eslint-disable-next-line no-param-reassign
        directives[directive] = values
      }
    })
  }
}
