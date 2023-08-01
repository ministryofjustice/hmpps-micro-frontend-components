import RestClient from './restClient'
import { UserPassport } from '../interfaces/userPassport'

export default class CentralSessionClient {
  constructor(private restClient: RestClient) {}

  private async get<T>(args: object): Promise<T> {
    return this.restClient.get<T>(args)
  }

  async getUserPassport(sid: string, serviceName: string): Promise<UserPassport> {
    return this.get<UserPassport>({ path: `/sessions/${sid}/${serviceName}` })
  }
}
