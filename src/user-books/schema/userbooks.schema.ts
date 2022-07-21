import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
import { Books } from 'src/books/schema/book.schema';
import { User } from 'src/user/schema/user.schema';
import { status } from './status-enums';
import { Exclude, Transform, Type } from 'class-transformer';

export type UserBooksDocument = UserBooks & Document;

@SchemaDecorator()
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

  @Prop({ type: Schema.Types.ObjectId, ref: 'User' })
  @Type(() => User)
  // @Transform(
  //   (value) => {
  //     if (Object.keys(value.value).length !== 0) return value.value;
  //   },
  //   { toClassOnly: true },
  // )
  recipient: User;

  @Prop({ type: Date, default: () => Date.now() })
  @Exclude()
  updatedAt: Date;

  @Prop({ type: Date, immutable: true, default: () => Date.now() })
  @Exclude()
  createdAt: Date;
}

export const UserBooksSchema = SchemaFactory.createForClass(UserBooks);

UserBooksSchema.pre<UserBooksDocument>('save', function () {
  this.updatedAt = new Date();
});
