import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import RequestWithUID from 'src/authentication/requestWithUID.interface';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':roomId/messages')
  async getMessagesForRoom(@Param('roomId') roomId: string) {
    return this.chatService.getMessagesForRoom(roomId);
  }

  @Post('room')
  async createOrGetChatRoom(
    @Request() req: RequestWithUID,
    @Body() body: { user2Id: string },
  ) {
    const user1Id = req.user.user_id;
    return {
      roomId: await this.chatService.createOrGetChatRoom(user1Id, body.user2Id),
    };
  }

  @Get('rooms')
  async getChatRoomsForUser(@Request() req: RequestWithUID) {
    const userId = req.user.user_id;

    return await this.chatService.getChatRoomsForUser(userId);
  }
}
