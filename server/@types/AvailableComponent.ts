export const AVAILABLE_COMPONENTS = ['header', 'footer'] as const

export type AvailableComponent = (typeof AVAILABLE_COMPONENTS)[number]

export const isComponent = (component: unknown): component is AvailableComponent =>
  AVAILABLE_COMPONENTS.includes(component as AvailableComponent)
