import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
import { UserBooks } from 'src/user-books/schema/userbooks.schema';
import { User } from 'src/user/schema/user.schema';
import { Transform, Type } from 'class-transformer';
import { status } from './status-enums';

export type BookRequestDocument = BookRequest & Document;

@SchemaDecorator({ timestamps: true })
export class BookRequest {
  @Transform(
    ({ obj }) => {
      return obj._id.toString();
    },
    { toClassOnly: true },
  )
  _id: string;

  @Prop({ type: Schema.Types.ObjectId, ref: 'UserBooks', required: true })
  @Type(() => UserBooks)
  userBook: UserBooks;

  @Prop({ type: Schema.Types.ObjectId, ref: 'User', required: true })
  @Type(() => User)
  sender: User;

  @Prop({ type: String, enum: status, default: 'CHECKED_IN' })
  status: string;

  @Prop({ type: Number, default: 0 })
  currentPage: number;

  @Prop({
    type: Date,
    default: null,
  })
  dueDate: Date;
}

export const BookRequestSchema = SchemaFactory.createForClass(BookRequest);
