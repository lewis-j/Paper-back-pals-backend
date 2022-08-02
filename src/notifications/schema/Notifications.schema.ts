import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/user/schema/user.schema';
export type NotificationsDocument = Notifications & mongoose.Document;

@Schema({ timestamps: true })
export class Notifications {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;
  @Prop({ required: true, default: false })
  isRead: boolean;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    enum: {
      values: ['BookRequest', 'FriendRequest'],
      message:
        "Please supply a valid client type.  Allowed: 'BookRequest' or 'FriendRequest'.",
    },
  })
  requestType: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'schemaType',
  })
  requestRef: mongoose.Types.ObjectId;
}

export const NotificationsSchema = SchemaFactory.createForClass(Notifications);
