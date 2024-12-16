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

export interface StatusUpdateOptions {
  status: string;
  imageUrl?: string;
}

interface StatusHistory {
  status: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface BookRequestDocument extends Document {
  _id: string;
  userBook: UserBooks;
  sender: User;
  status: string;
  statusHistory: StatusHistory[];
  currentPage: number;
  dueDate: Date;
  pictureRequired: boolean;
  updateStatus(options: StatusUpdateOptions): void;
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
      imageUrl: { type: String, required: false },
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

  @Prop({ type: Boolean, default: false })
  pictureRequired: boolean;
}

export const BookRequestSchema = SchemaFactory.createForClass(BookRequest);

BookRequestSchema.methods.updateStatus = function (
  options: StatusUpdateOptions,
) {
  if (this.pictureRequired && !options.imageUrl) {
    throw new Error('Image is required for status updates on this request');
  }

  this.status = options.status;

  const statusEntry: StatusHistory = {
    status: options.status,
    timestamp: new Date(),
  };

  if (options.imageUrl) {
    statusEntry.imageUrl = options.imageUrl;
  }

  if (!this.statusHistory) {
    this.statusHistory = [];
  }

  this.statusHistory.push(statusEntry);
};
