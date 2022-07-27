import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
import { UserBooks } from 'src/user-books/schema/userbooks.schema';
import { User } from 'src/user/schema/user.schema';
import { Exclude, Transform, Type } from 'class-transformer';
import { status } from './status';

export type BookRequestDocument = BookRequest & Document;

@SchemaDecorator()
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
  @Type((obj) => {
    console.log(
      '*****************************************',
      'obj',
      obj,
      '*****************************************',
    );
    return User;
  })
  requester: User;

  @Prop({ type: String, enum: status, default: status[0] })
  status: string;

  @Prop({ type: Date, default: () => Date.now() })
  @Exclude()
  updatedAt: Date;

  @Prop({ type: Date, immutable: true, default: () => Date.now() })
  @Exclude()
  createdAt: Date;
}

export const BookRequestSchema = SchemaFactory.createForClass(BookRequest);

BookRequestSchema.pre<BookRequestDocument>('save', function () {
  this.updatedAt = new Date();
});
