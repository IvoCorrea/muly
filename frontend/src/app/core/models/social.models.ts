export interface NotificationResponse {
  id: string;
  actorUsername: string;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  type: 'FOLLOW' | 'REVIEW_LIKE' | 'REVIEW_COMMENT' | string;
  message: string;
  targetUrl: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationSummaryResponse {
  unreadCount: number;
  notifications: NotificationResponse[];
}
