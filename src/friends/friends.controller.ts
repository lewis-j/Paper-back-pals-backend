import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotAcceptableException,
  Param,
  Post,
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
    const { _id, profilePic, username } = await this.friendsService.addFriend(
      friendRequest_id,
      user_id,
    );
    return { _id, profilePic, username };
  }
  @Post('request/:id')
  async makeRequest(
    @Param('id') recipient_id: string,
    @Req() req: RequestWithUID,
  ) {
    console.log('recipient_id', recipient_id);

    const { user_id } = req.user;
    try {
      const notification = await this.friendsService.createRequest(
        user_id,
        recipient_id,
      );
      console.log(notification);
      return { notification };
    } catch (error) {
      console.log('error in post friend request', error.message);
      throw new HttpException(error.message, HttpStatus.CONFLICT);
    }
  }
}
