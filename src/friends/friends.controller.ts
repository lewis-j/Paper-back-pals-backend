import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotAcceptableException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import RequestWithUID from 'src/authentication/requestWithUID.interface';
import { FriendsService } from './friends.service';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('add/:id')
  async addFriend(
    @Param('id') friendRequest_id: string,
    @Req() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
    const { friend, notification } = await this.friendsService.addFriend(
      friendRequest_id,
      user_id,
    );
    return { friend, notification };
  }
  @Post('request/:id')
  async makeRequest(
    @Param('id') recipient_id: string,
    @Req() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
    try {
      const { notification, newFriendRequest } =
        await this.friendsService.createRequest(user_id, recipient_id);
      return { notification, newFriendRequest };
    } catch (error) {
      console.error('error in post friend request', error.message);
      throw new HttpException(error.message, HttpStatus.CONFLICT);
    }
  }
  @Put('remove/:id')
  async removeFriend(
    @Param('id') friend_id: string,
    @Req() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
    return await this.friendsService.removeFriend(friend_id, user_id);
  }
}
