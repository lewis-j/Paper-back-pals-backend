import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserBooks, UserBooksDocument } from './schema/userbooks.schema';
import { BooksService } from 'src/books/books.service';
import { createBookDto } from 'src/books/dto/createBookDto';

@Injectable()
export class UserBooksService {
  constructor(
    @InjectModel(UserBooks.name)
    private readonly userBooksModel: Model<UserBooksDocument>,
    private bookService: BooksService,
  ) {}

  async createUserBook(user_id: string, book: createBookDto) {
    const book_id = await this.bookService.createBook(book);

    const userId = new Types.ObjectId(user_id);

    const userBook = new this.userBooksModel({
      book: book_id,
      owner: userId,
    });
    const newUserBook = await userBook.save();
    return newUserBook.populate(['book', 'owner']);
  }

  async getOWnedBooks(user_id: string) {
    const userId = new Types.ObjectId(user_id);
    return await this.userBooksModel
      .find({ owner: userId })
      .populate(['book', 'recipient'])
      .exec();
  }

  async getBorrowedBooks(user_id: string) {
    const userId = new Types.ObjectId(user_id);
    try {
      return await this.userBooksModel
        .find({ recipient: userId })
        .populate(['book', 'owner'])
        .exec();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
