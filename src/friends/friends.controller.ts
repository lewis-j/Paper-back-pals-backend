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
  addFriend(@Param('id') request_id: string, @Req() req: RequestWithUID) {
    console.log('request_id================', request_id);
    const { user_id } = req.user;
    this.friendsService.addFriend(request_id, user_id);
  }
  @Post('request/:id')
  async makeRequest(
    @Param('id') reciever_id: string,
    @Req() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
    try {
      await this.friendsService.createRequest(user_id, reciever_id);
    } catch (error) {
      console.log('error in post friend request', error.message);
      throw new HttpException(error.message, HttpStatus.CONFLICT);
    }
  }
}
