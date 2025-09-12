import { ApolloClient, gql, TypedDocumentNode } from '@apollo/client'
import { ManagedPageLink, ManagedPagesQuery } from '../interfaces/managedPage'
import config from '../config'

export default class ContentfulService {
  constructor(private readonly apolloClient: ApolloClient) {}

  /**
   * Get list of `managedPage` links.
   */
  public async getManagedPages(): Promise<ManagedPageLink[]> {
    const getManagedPagesQuery: TypedDocumentNode<ManagedPagesQuery, Record<string, never>> = gql`
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

    return items.map(page => ({ href: `${config.serviceUrls.dps.url}/${page.slug}`, text: page.title }))
  }
}
