import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import {
  Notifications,
  NotificationsDocument,
} from './schema/Notifications.schema';
import CreateNotifications from './interface/CreateNotifications.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notifications.name)
    private readonly notificationsModel: Model<NotificationsDocument>,
  ) {}
  public async createNotification(
    notificationsData: CreateNotifications,
    session: ClientSession,
  ) {
    const {
      sender: { _id: sender_id, ...senderPayload },
      recipient: { _id: recipient_id, ...recipientPayload },
      requestPayload,
    } = notificationsData;
    const senderAsObjectId = new Types.ObjectId(sender_id);
    const recipientAsObjectId = new Types.ObjectId(recipient_id);

    console.log('requestPayload:', requestPayload);

    try {
      return await this.notificationsModel.create(
        [
          {
            ...requestPayload,
            ...senderPayload,
            user: recipientAsObjectId,
            recipient: senderAsObjectId,
          },
          {
            ...requestPayload,
            ...recipientPayload,
            user: senderAsObjectId,
            recipient: recipientAsObjectId,
          },
        ],
        { session: session },
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async markAsRead(notification_id: string) {
    return this.notificationsModel.findByIdAndUpdate(
      notification_id,
      { isRead: true },
      {
        new: true,

        populate: {
          path: 'user',
          select: 'profilePic username',
        },
        select: '-createdAt -updatedAt -recipient',
      },
    );
  }

  public async getOneNotification(notification_id: string) {
    const notification = await this.notificationsModel.findById(
      notification_id,
    );
    return await notification.populate('schemaRef');
  }

  public async getNotifications(user_id: string) {
    const notificationDocs = await this.notificationsModel.find(
      {
        recipient: user_id,
      },
      null,
      {
        sort: '-createdAt',
        populate: {
          path: 'user',
          select: 'profilePic username',
        },
        select: '-updatedAt -recipient',
      },
    );

    return notificationDocs;
  }
}
