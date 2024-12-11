import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';
import { ChatRoom, ChatRoomDocument } from './chat-room.schema';
import * as mongoose from 'mongoose';

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
    console.log('Getting chat rooms for user:', userId);

    // Convert userId to ObjectId if needed
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const basicRooms = await this.chatRoomModel
      .find({ participants: userObjectId })
      .lean()
      .exec();

    console.log('Basic rooms (without population):', basicRooms);

    const rooms = await this.chatRoomModel
      .find({ participants: userObjectId })
      .populate({
        path: 'participants',
        match: { _id: { $ne: userObjectId } },
        select: 'username profilePic',
        model: 'User',
      })
      .lean()
      .exec();

    console.log('Rooms after population:', rooms);

    if (rooms.length === 0) {
      return [];
    }

    // Fetch last message for each room
    const roomsWithLastMessage = await Promise.all(
      rooms.map(async (room) => {
        const lastMessage = await this.messageModel
          .findOne({ roomId: room.roomId })
          .sort({ timestamp: -1 })
          .lean()
          .exec();

        console.log(`Last message for room ${room.roomId}:`, lastMessage);

        return {
          ...room,
          lastMessage,
        };
      }),
    );

    console.log('Final rooms with messages:', roomsWithLastMessage);
    return roomsWithLastMessage;
  }
}
