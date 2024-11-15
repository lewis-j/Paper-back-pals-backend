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

// Add new interface for status history
interface StatusHistory {
  status: string;
  timestamp: Date;
}

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

  @Prop([
    {
      status: { type: String, enum: status },
      timestamp: { type: Date, default: Date.now },
    },
  ])
  statusHistory: StatusHistory[];

  @Prop({ type: Number, default: 0 })
  currentPage: number;

  @Prop({
    type: Date,
    default: null,
  })
  dueDate: Date;
}

export const BookRequestSchema = SchemaFactory.createForClass(BookRequest);

// Add a pre-save middleware to track status changes
BookRequestSchema.pre('save', function (next) {
  const bookRequest = this as BookRequestDocument;

  if (bookRequest.isModified('status')) {
    if (!bookRequest.statusHistory) {
      bookRequest.statusHistory = [];
    }

    bookRequest.statusHistory.push({
      status: bookRequest.status,
      timestamp: new Date(),
    });
  }

  next();
});
