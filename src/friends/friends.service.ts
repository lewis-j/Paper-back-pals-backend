import {
  HttpCode,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { UserService } from 'src/user/user.service';
import {
  FriendRequest,
  FriendRequestsDocument,
} from './schema/friendRequest.schema';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(FriendRequest.name)
    private readonly friendRequest: Model<FriendRequestsDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly usersService: UserService,
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

      return await this.friendRequest.create({
        sender: userAsObjectId,
        recipient: recipientAsObjectId,
      });
    } catch (error) {
      console.log('Error:::', error);
      return Promise.reject(error);
    }
  };

  public removeRequest = async (request_id: string) => {
    return await this.friendRequest.remove(request_id);
  };

  public addFriend = async (request_id: string, user_id: string) => {
    const request = await this.friendRequest.findById(request_id);
    if (!request) throw new NotFoundException('request does not exist!');
    const { recipient, sender } = request;

    if (recipient.toString().localeCompare(user_id))
      throw new UnauthorizedException('Wrong user attempt');
    try {
      const session = await this.connection.startSession();
      const newFriend = await this.withTransaction(session, async () => {
        await request.remove({ session: session });
        return await this.usersService.addFriendFromRequest(request, session);
      });
      session.endSession();
      return newFriend;
    } catch (error) {
      return Promise.reject(error);
    }
  };

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
