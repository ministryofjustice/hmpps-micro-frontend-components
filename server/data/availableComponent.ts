import type { AvailableComponent } from '../interfaces/externalContract'

export const AVAILABLE_COMPONENTS = ['header', 'footer'] as const satisfies AvailableComponent[]

export const isComponent = (component: unknown): component is AvailableComponent =>
  AVAILABLE_COMPONENTS.includes(component as AvailableComponent)
