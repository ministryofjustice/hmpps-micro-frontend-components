export const AVAILABLE_COMPONENTS = ['header', 'footer'] as const
export type AvailableComponent = (typeof AVAILABLE_COMPONENTS)[number]
