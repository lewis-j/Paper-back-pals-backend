import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BooksDocument = Books & Document;

@Schema()
export class Books {
  @Prop({ required: true })
  google_id: string;

  @Prop({ required: true })
  coverImg: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: [String], required: true })
  authors: string[];

  @Prop({ required: true })
  description: string;
}

export const BooksSchema = SchemaFactory.createForClass(Books);
