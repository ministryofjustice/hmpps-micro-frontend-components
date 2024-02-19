import { ApolloClient, gql } from '@apollo/client/core'
import { ManagedPage, ManagedPageLink } from '../interfaces/managedPage'
import config from '../config'

export default class ContentfulService {
  constructor(private readonly apolloClient: ApolloClient<unknown>) {}

  /**
   * Get list of `managedPage` links.
   */
  public async getManagedPages(): Promise<ManagedPageLink[]> {
    const getManagedPagesQuery = gql`
      query ManagedPages {
        managedPageCollection(limit: 100, order: seq_ASC) {
          items {
            title
            slug
          }
        }
      }
    `

    const { items } = (
      await this.apolloClient.query({
        query: getManagedPagesQuery,
      })
    ).data.managedPageCollection

    return items.map((page: ManagedPage) => ({ href: `${config.serviceUrls.dps.url}/${page.slug}`, text: page.title }))
  }
}
