import { Injectable, UnauthorizedException } from '@nestjs/common';
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

  async createRequest(user_id: string, reciever_id: string) {
    const userAsObjectId = new Types.ObjectId(user_id);
    const recieverAsObjectId = new Types.ObjectId(reciever_id);
    return await this.friendRequest.create({
      sender: userAsObjectId,
      reciever: recieverAsObjectId,
    });
  }

  public addFriend = async (request_id: string, user_id: string) => {
    const session = await this.connection.startSession();
    const request = await this.friendRequest.findById(request_id);
    const { reciever } = request;

    if (reciever.toString().localeCompare(user_id))
      throw new UnauthorizedException('Wrong user attempt');

    await session.withTransaction(async () => {
      await request.remove({ session: session });
      await this.usersService.addFriendFromRequest(request, session);
    });

    session.endSession();
  };
}
