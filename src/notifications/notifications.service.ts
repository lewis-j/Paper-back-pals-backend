import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
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
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}
  public async createNotification(notificationsData: CreateNotifications) {
    const {
      sender_id,
      recipient_id,
      notificationPayload: { requestType, messages, requestRef },
    } = notificationsData;
    const requestData = { requestType, requestRef };
    const senderAsObjectId = new Types.ObjectId(sender_id);
    const recipientAsObjectId = new Types.ObjectId(recipient_id);

    const session = await this.connection.startSession();
    const notificationObj = {
      ...requestData,
      user: recipientAsObjectId,
      message: messages.recipient,
    };
    console.log('notificationObj', notificationObj);

    const createNotifications = async () => {
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
    };
    const senderNotification = await this.withTransaction(
      session,
      createNotifications,
    );

    session.endSession();

    return senderNotification;
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
  //https://jira.mongodb.org/browse/NODE-2014
  private withTransaction = async (session, closure) => {
    let result;
    await session.withTransaction(() => {
      result = closure();
      return result;
    });
    return result;
  };
}
