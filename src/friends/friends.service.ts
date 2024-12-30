import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { requestTypeEnum } from 'src/notifications/dto/CreateNotificationDto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserService } from 'src/user/user.service';
import {
  FriendRequest,
  FriendRequestsDocument,
} from './schema/friendRequest.schema';
import {
  FriendRequestStatus,
  friendRequestStatus,
} from './schema/friend-request-status';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(FriendRequest.name)
    private readonly friendRequest: Model<FriendRequestsDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly usersService: UserService,
    private readonly notificationsService: NotificationsService,
  ) {}

  public createRequest = async (user_id: string, recipient_id: string) => {
    const userAsObjectId = new Types.ObjectId(user_id);
    const recipientAsObjectId = new Types.ObjectId(recipient_id);

    try {
      const result = await this.friendRequest.findOne({
        sender: userAsObjectId,
        recipient: recipientAsObjectId,
      });
      if (result) throw Error('Request already exist');

      const friendRequest = new this.friendRequest({
        sender: userAsObjectId,
        recipient: recipientAsObjectId,
      });

      const newFriendRequest = await friendRequest.save();
      await newFriendRequest.populate({
        path: 'recipient',
        select: '_id username profilePic',
      });

      const friendRequestObj = newFriendRequest.toObject();
      delete friendRequestObj.sender;

      const [notification] = await this.createNotification(
        user_id,
        recipient_id,
        newFriendRequest._id,
        friendRequestStatus.PENDING,
      );
      const populatedNotification = await notification.populate({
        path: 'requestRef',
        model: 'FriendRequest',
        select: 'status',
      });
      console.log('populatedNotification', populatedNotification);
      return {
        notification: populatedNotification,
        newFriendRequest: friendRequestObj,
      };
    } catch (error) {
      console.log('Error:::', error);
      return Promise.reject(error);
    }
  };

  public removeRequest = async (request_id: string) => {
    return await this.friendRequest.deleteOne({ _id: request_id });
    //TODO: remove notification
  };

  public addFriend = async (request_id: string, user_id: string) => {
    console.log('addFriend', request_id, user_id);
    const request = await this.friendRequest.findById(request_id);
    if (!request) throw new NotFoundException('request does not exist!');
    const { recipient, sender } = request;

    if (recipient.toString().localeCompare(user_id))
      throw new UnauthorizedException('Wrong user attempt');
    try {
      const session = await this.connection.startSession();
      const friend = await this.withTransaction(session, async () => {
        request.status = friendRequestStatus.ACCEPTED;
        await request.save({ session: session });
        return await this.usersService.addFriendFromRequest(request, session);
      });
      session.endSession();
      const [_, notification] = await this.createNotification(
        user_id,
        recipient.toString(),
        request._id.toString(),
        friendRequestStatus.ACCEPTED,
      );
      return { friend, notification };
    } catch (error) {
      return Promise.reject(error);
    }
  };

  private createNotification = async (
    user_id: string,
    recipient_id: string,
    newRequest_id: string,
    status: FriendRequestStatus,
  ) => {
    const userInfo = await this.usersService.getOneUser(user_id);
    const recipientInfo = await this.usersService.getOneUser(recipient_id);

    let senderMessage: string;
    let recipientMessage: string;
    let recipientConfirmation: string | undefined;

    switch (status) {
      case friendRequestStatus.PENDING:
        senderMessage = `You made a Friend request to ${recipientInfo.username}`;
        recipientMessage = `${userInfo.username} has requested to be your Friend`;
        recipientConfirmation = `Accept the friend request from ${userInfo.username}?`;
        break;
      case friendRequestStatus.ACCEPTED:
        senderMessage = `${recipientInfo.username} accepted your friend request`;
        recipientMessage = `You accepted ${userInfo.username}'s friend request`;
        break;
      case friendRequestStatus.DECLINED:
        senderMessage = `${recipientInfo.username} declined your friend request`;
        recipientMessage = `You declined ${userInfo.username}'s friend request`;
        break;
      default:
        throw new Error('Invalid friend request status');
    }

    const notificationPayload = {
      sender: {
        _id: user_id,
        message: senderMessage,
      },
      recipient: {
        _id: recipient_id,
        message: recipientMessage,
        ...(recipientConfirmation && { confirmation: recipientConfirmation }),
      },
      requestPayload: {
        requestType: requestTypeEnum['FriendRequest'],
        requestRef: newRequest_id,
      },
    };

    return await this.notificationsService.createNotificationForTwoUsers(
      notificationPayload,
    );
  };

  //https://jira.mongodb.org/browse/NODE-2014
  private withTransaction = async (session, closure) => {
    let result;
    await session.withTransaction(() => {
      result = closure(session);
      return result;
    });
    return result;
  };
}
