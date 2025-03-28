// eslint-disable-next-line no-shadow
export enum NotificationType {
  PATHFINDER,
}


export interface Notification {
  id: string,
  userId: string,
  type: NotificationType
  content: string
  url: string
  seen?: boolean
}