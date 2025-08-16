const SocketsEvents = {
  CALL_REQUEST: 'call_request',
  CALL_ACCEPT: 'call_accept',
  CALL_REJECT: 'call_reject',
  CALL_ENDED: 'call_ended',
  ICE_CANDIDATE: 'ice_candidate',
  CALL_ANSWER: 'call_answer',
  CALL_ANSWERED: 'call_answered',
  CALL_BUSY: 'call_busy',
  CALL_ERROR: 'call_error',
  CHAT_MESSAGE: 'chat_message',
  CHAT_TYPING: 'chat_typing',
  CHAT_STOP_TYPING: 'chat_stop_typing',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_STATUS_UPDATE: 'user_status_update',
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATION_DELETE: 'notification_delete',
  MESSAGE_READ: 'message_read',
}

export default SocketsEvents
export type SocketsEventsType = keyof typeof SocketsEvents
