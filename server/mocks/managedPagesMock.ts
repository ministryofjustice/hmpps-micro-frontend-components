import { ManagedPage, ManagedPageLink } from '../interfaces/managedPage'
import config from '../config'

export const managadPageLinksMock: ManagedPageLink[] = [
  { href: `${config.dpsUrl}/title-one`, text: 'Title 1' },
  { href: `${config.dpsUrl}/title-two`, text: 'Title 2' },
]

export const managedPagesMock: ManagedPage[] = [
  { title: 'Title 1', slug: 'title-one', content: 'Content one' },
  { title: 'Title 2', slug: 'title-two', content: 'Content two' },
]

export const managedPagesCollectionMock = {
  data: {
    managedPageCollection: {
      items: managedPagesMock,
    },
  },
}
