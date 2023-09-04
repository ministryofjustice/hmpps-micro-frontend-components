import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import ContentfulService from './contentfulService'
import { managadPageLinksMock, managedPagesCollectionMock } from '../mocks/managedPagesMock'

describe('ContentfulService', () => {
  let contentfulService: ContentfulService

  beforeEach(() => {
    contentfulService = new ContentfulService(new ApolloClient<unknown>({ cache: new InMemoryCache() }))
  })

  it('should get managed pages', async () => {
    const apolloSpy = jest
      .spyOn<any, string>(contentfulService['apolloClient'], 'query')
      .mockResolvedValue(managedPagesCollectionMock)

    const pages = await contentfulService.getManagedPages()

    expect(apolloSpy).toHaveBeenCalled()
    expect(pages).toEqual(managadPageLinksMock)
  })
})
