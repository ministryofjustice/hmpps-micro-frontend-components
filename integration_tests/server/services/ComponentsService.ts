import AvailableComponent from '../data/interfaces/AvailableComponent'
import Component from '../data/interfaces/component'
import ComponentClient from '../data/componentApiClient'

export default class FeComponentsService {
  constructor(private readonly feComponentsClient: ComponentClient) {}

  async getComponents<T extends AvailableComponent[]>(
    components: T,
    token: string,
  ): Promise<Record<T[number], Component>> {
    return this.feComponentsClient.getComponents(components, token, true)
  }
}
