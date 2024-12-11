import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class ChatRoom {
  @Prop({ required: true, unique: true })
  roomId: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  participants: string[];
}

export type ChatRoomDocument = ChatRoom & Document;
export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
