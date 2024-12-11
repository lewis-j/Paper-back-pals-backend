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
  imageUrl?: string;
}

interface StatusUpdateOptions {
  status: string;
  imageUrl?: string;
  // You can add other metadata here in the future
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

  // Add a method to update status with metadata
  updateStatus(options: StatusUpdateOptions) {
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
  }
}

export const BookRequestSchema = SchemaFactory.createForClass(BookRequest);
