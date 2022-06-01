import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
import { Books } from 'src/books/schema/book.schema';
import { Users } from 'src/users/schema/user.schema';
import { status } from './status-enums';
import { Exclude, Transform, Type } from 'class-transformer';

export type UserBooksDocument = UserBooks & Document;

@SchemaDecorator()
export class UserBooks {
  @Prop({ type: Schema.Types.ObjectId, ref: 'Books', required: true })
  @Type(() => Books)
  book: Books;

  @Prop({ type: Schema.Types.ObjectId, ref: 'Users', required: true })
  @Type(() => Users)
  @Transform(
    (value) => {
      console.log('transforming value', value);
      return value;
    },
    { toClassOnly: true },
  )
  owner: Users;

  @Prop({ type: Schema.Types.ObjectId, ref: 'Users' })
  @Type(() => Users)
  recipient: Users;

  @Prop({ type: String, enum: status, default: status[0] })
  status: string;

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
