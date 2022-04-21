import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { exec } from 'child_process';
import { Model } from 'mongoose';
import { createBookDto } from './dto/createBookDto';
import { Books, BooksDocument } from './schema/book.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Books.name) private readonly bookModel: Model<BooksDocument>,
  ) {}

  async createBook(book: createBookDto) {
    const result = await this.bookModel
      .findOne({ google_id: book.google_id })
      .exec();
    if (!result) {
      const newBook = new this.bookModel(book);
      const createdBook = await newBook.save();
      return createdBook._id;
    }
    return result._id;
  }
}
