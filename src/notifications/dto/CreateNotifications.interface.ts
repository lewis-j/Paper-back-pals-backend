import { CreateNotificationDto } from './CreateNotificationDto';

interface CreateNotifications {
  sender_id: string;
  recipient_id: string;
  notificationPayload: CreateNotificationDto;
}

export default CreateNotifications;
