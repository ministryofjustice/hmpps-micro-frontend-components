import RestClient from './restClient'
import Component from './interfaces/component'
import { ComponentApiClient } from './interfaces/componentApiClient'
import AvailableComponent from './interfaces/AvailableComponent'
import config from '../config'

export default class ComponentApiRestClient implements ComponentApiClient {
  private static restClient(token: string): RestClient {
    return new RestClient('Components Api Client', config.apis.frontendComponents, token)
  }

  getComponents<T extends AvailableComponent[]>(
    components: T,
    userToken: string,
    useLatest: boolean,
  ): Promise<Record<T[number], Component>> {
    const useLatestHeader = useLatest ? { 'x-use-latest-features': 'true' } : {}
    return ComponentApiRestClient.restClient(userToken).get<Record<T[number], Component>>({
      path: `/components`,
      query: `component=${components.join('&component=')}`,
      headers: { 'x-user-token': userToken, ...useLatestHeader },
    })
  }
}
