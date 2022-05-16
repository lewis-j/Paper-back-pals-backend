import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Books } from 'src/books/schema/book.schema';
import { Users } from 'src/users/schema/user.schema';
import { status } from './status-enums';

export type UserBooksDocument = UserBooks & Document;

@Schema()
export class UserBooks {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Books', required: true })
  book: Books;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true })
  owner: Users;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Users' })
  recipient: Users;

  @Prop({ type: String, enum: status, default: status[0] })
  status: string;

  @Prop({ type: Date, default: () => Date.now() })
  updatedAt: Date;

  @Prop({ type: Date, immutable: true, default: () => Date.now() })
  createdAt: Date;
}

export const UserBooksSchema = SchemaFactory.createForClass(UserBooks);
