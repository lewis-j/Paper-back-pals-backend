import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/user/schema/user.schema';
import { Books } from 'src/books/schema/book.schema';

export type RatingDocument = Rating & Document;

@Schema({
  timestamps: true,
})
export class Rating {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Books', required: true })
  book: Books;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  review: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

// Create a compound index to ensure a user can only rate a book once
RatingSchema.index({ user: 1, book: 1 }, { unique: true });
