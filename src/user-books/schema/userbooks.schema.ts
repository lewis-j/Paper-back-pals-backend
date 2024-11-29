import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
import { Books } from 'src/books/schema/book.schema';
import { User } from 'src/user/schema/user.schema';
import { Transform, Type } from 'class-transformer';
import { BookRequest } from './bookRequest.schema';

export type UserBooksDocument = UserBooks & Document;

@SchemaDecorator({ timestamps: true })
export class UserBooks {
  @Transform(
    ({ obj }) => {
      return obj._id.toString();
    },
    { toClassOnly: true },
  )
  _id: string;

  @Prop({ type: Schema.Types.ObjectId, ref: 'Books', required: true })
  @Type(() => Books)
  book: Books;

  @Prop({ type: Schema.Types.ObjectId, ref: 'User', required: true })
  @Type(() => User)
  // @Transform(
  //   (value) => {
  //     if (Object.keys(value.value).length !== 0) return value.value;
  //   },
  //   { toClassOnly: true },
  // )
  owner: User;

  @Prop([{ type: Schema.Types.ObjectId, ref: 'BookRequest', default: null }])
  @Type(() => BookRequest)
  requests: BookRequest[];
}

export const UserBooksSchema = SchemaFactory.createForClass(UserBooks);
