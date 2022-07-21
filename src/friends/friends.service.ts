import {
  HttpCode,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { async } from 'rxjs';
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

  public createRequest = async (user_id: string, reciever_id: string) => {
    const userAsObjectId = new Types.ObjectId(user_id);
    const recieverAsObjectId = new Types.ObjectId(reciever_id);

    try {
      const result = await this.friendRequest.findOne({
        sender: userAsObjectId,
        reciever: recieverAsObjectId,
      });
      console.log('sender:', userAsObjectId, 'reciever', reciever_id);
      console.log('Does request exist?', result);
      if (result) throw Error('Request already exist');

      return await this.friendRequest.create({
        sender: userAsObjectId,
        reciever: recieverAsObjectId,
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
    const { reciever, sender } = request;

    if (reciever.toString().localeCompare(user_id))
      throw new UnauthorizedException('Wrong user attempt');
    try {
      const session = await this.connection.startSession();
      await session.withTransaction(async () => {
        await request.remove({ session: session });
        await this.usersService.addFriendFromRequest(request, session);
        return sender;
      });
      session.endSession();
    } catch (error) {
      return Promise.reject(error);
    }
  };
}
