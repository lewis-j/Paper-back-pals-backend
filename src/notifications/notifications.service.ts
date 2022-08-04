import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { ClientSession, Model, Types } from 'mongoose';
import { CreateNotificationDto } from './dto/CreateNotificationDto';
import CreateNotifications from './dto/CreateNotifications.interface';

import {
  Notifications,
  NotificationsDocument,
} from './schema/Notifications.schema';

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
      sender_id,
      recipient_id,
      notificationPayload: { requestType, messages, requestRef },
    } = notificationsData;
    const requestData = { requestType, requestRef };
    const senderAsObjectId = new Types.ObjectId(sender_id);
    const recipientAsObjectId = new Types.ObjectId(recipient_id);

    const notificationObj = {
      ...requestData,
      user: recipientAsObjectId,
      message: messages.recipient,
    };
    console.log('notificationObj', notificationObj);

    try {
      await this.notificationsModel.create(
        [
          {
            ...requestData,
            user: recipientAsObjectId,
            message: messages.recipient,
          },
        ],
        { session: session },
      );
      return await this.notificationsModel.create(
        [
          {
            ...requestData,
            user: senderAsObjectId,
            message: messages.sender,
          },
        ],
        { session: session },
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public async getOneNotification(notification_id: string) {
    const notification = await this.notificationsModel.findById(
      notification_id,
    );
    return await notification.populate('schemaRef');
  }

  public async getManyNotifications(notificationIds: string[]) {
    const notificationDocs = this.notificationsModel.find({
      _id: { $in: notificationIds },
    });

    return notificationDocs.populate('schemaRef');
  }
}
