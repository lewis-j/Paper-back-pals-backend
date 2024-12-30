import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import {
  Notifications,
  NotificationsDocument,
} from './schema/Notifications.schema';
import CreateNotifications from './interface/CreateNotifications.interface';
import { BookRequest } from 'src/user-books/schema/bookRequest.schema';
import { FriendRequest } from 'src/friends/schema/friendRequest.schema';
import { notificationQueryOptions } from 'src/util/query.utils';

interface PopulatedNotification
  extends Omit<NotificationsDocument, 'requestRef'> {
  requestRef: BookRequest | FriendRequest | Types.ObjectId;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notifications.name)
    private readonly notificationsModel: Model<NotificationsDocument>,
  ) {}
  public async createNotificationForTwoUsers(
    notificationsData: CreateNotifications,
  ) {
    const {
      sender: { _id: sender_id, ...senderPayload },
      recipient: { _id: recipient_id, ...recipientPayload },
      requestPayload,
    } = notificationsData;
    const senderAsObjectId = new Types.ObjectId(sender_id);
    const recipientAsObjectId = new Types.ObjectId(recipient_id);

    try {
      const notifications = await this.notificationsModel.create([
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
      ]);

      return await this.notificationsModel.find(
        { _id: { $in: notifications.map((n) => n._id) } },
        null,
        { ...notificationQueryOptions },
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
    // Get all unread notifications

    const unreadNotifications = await this.notificationsModel.find(
      {
        recipient: user_id,
        isRead: false,
      },
      null,
      {
        ...notificationQueryOptions,
      },
    );

    // Get 10 most recent read notifications
    const readNotifications = await this.notificationsModel.find(
      {
        recipient: user_id,
        isRead: true,
      },
      null,
      { ...notificationQueryOptions, limit: 10 },
    );
    const processedUnreadNotifications = unreadNotifications.map(
      (notification: PopulatedNotification) => {
        const processed = { ...notification.toObject() };

        // Check if requestRef exists and is populated (not an ObjectId)
        const isPopulated =
          notification.requestRef && !('_bsontype' in notification.requestRef);

        if (isPopulated) {
          const ref = notification.requestRef as BookRequest | FriendRequest;
          processed.requestRef = {
            _id: ref._id,
            ...(ref.status && { status: ref.status }),
          };
        }

        return processed;
      },
    );

    // Combine and sort both arrays
    return [...processedUnreadNotifications, ...readNotifications].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  public async markAllAsRead(user_id: string) {
    return this.notificationsModel.updateMany(
      { recipient: user_id },
      { isRead: true },
    );
  }
}
