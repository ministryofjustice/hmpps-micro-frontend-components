import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import ContentfulService from './contentfulService'
import { managedPageLinksMock, managedPagesCollectionMock } from '../mocks/managedPagesMock'

describe('ContentfulService', () => {
  let contentfulService: ContentfulService

  beforeEach(() => {
    contentfulService = new ContentfulService(
      new ApolloClient({
        cache: new InMemoryCache(),
        link: new HttpLink({}),
      }),
    )
  })

  it('should get managed pages', async () => {
    const apolloSpy = jest.spyOn(contentfulService.apolloClient, 'query').mockResolvedValue(managedPagesCollectionMock)

    const pages = await contentfulService.getManagedPages()

    expect(apolloSpy).toHaveBeenCalled()
    expect(pages).toEqual(managedPageLinksMock)
  })
})
