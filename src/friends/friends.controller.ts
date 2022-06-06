import {
  Body,
  Controller,
  Get,
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
    const { user_id } = req.user;
    this.friendsService.addFriend(request_id, user_id);
  }
  @Post('request/:id')
  makeRequest(@Param('id') reciever_id, @Req() req: RequestWithUID) {
    const { user_id } = req.user;
    this.friendsService.createRequest(user_id, reciever_id);
  }
}
