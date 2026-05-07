import { Document } from '@contentful/rich-text-types'

export interface ManagedPage {
  title: string
  slug: string
  content?: string
}

export interface ManagedPageLink {
  href: string
  text: string
}

export interface ManagedPageApollo {
  title: string
  slug: string
  content?: {
    json: Document
  }
}

export interface ManagedPagesQuery {
  managedPageCollection: {
    items: ManagedPage[]
  }
}
