import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';
import { ChatRoom, ChatRoomDocument } from './chat-room.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
  ) {}

  async createMessage(
    roomId: string,
    sender: string,
    content: string,
  ): Promise<Message> {
    const newMessage = new this.messageModel({ roomId, sender, content });
    return newMessage.save();
  }

  async getMessagesForRoom(roomId: string): Promise<Message[]> {
    return this.messageModel.find({ roomId }).sort({ timestamp: 1 }).exec();
  }

  async createOrGetChatRoom(user1Id: string, user2Id: string): Promise<string> {
    const participants = [user1Id, user2Id].sort();
    const roomId = this.generateRoomId(participants[0], participants[1]);

    let chatRoom = await this.chatRoomModel.findOne({ roomId });

    if (!chatRoom) {
      chatRoom = new this.chatRoomModel({ roomId, participants });
      await chatRoom.save();
    }

    return roomId;
  }

  private generateRoomId(user1Id: string, user2Id: string): string {
    return `${user1Id}_${user2Id}`;
  }

  async getChatRoomsForUser(userId: string): Promise<ChatRoom[]> {
    return this.chatRoomModel.find({ participants: userId }).exec();
  }
}
