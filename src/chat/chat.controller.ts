import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':roomId/messages')
  async getMessagesForRoom(@Param('roomId') roomId: string) {
    return this.chatService.getMessagesForRoom(roomId);
  }

  @Post('room')
  async createOrGetChatRoom(
    @Body() body: { user1Id: string; user2Id: string },
  ) {
    return {
      roomId: await this.chatService.createOrGetChatRoom(
        body.user1Id,
        body.user2Id,
      ),
    };
  }

  @Get('rooms/:userId')
  async getChatRoomsForUser(@Param('userId') userId: string) {
    return this.chatService.getChatRoomsForUser(userId);
  }
}
