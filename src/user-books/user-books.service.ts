import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserBooks, UserBooksDocument } from './schema/userbooks.schema';
import { BooksService } from 'src/books/books.service';
import { createBookDto } from 'src/books/dto/createBookDto';
import { BookRequestService } from 'src/book-request/book-request.service';

@Injectable()
export class UserBooksService {
  constructor(
    @InjectModel(UserBooks.name)
    private readonly userBooksModel: Model<UserBooksDocument>,
    private bookService: BooksService,
    private bookRequestService: BookRequestService,
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

  async createBookRequest(user_id: string, userBook_id: string) {
    const user = await this.bookRequestService.doesRequestExist(
      user_id,
      userBook_id,
    );
    if (user) {
      throw new ConflictException(`book request from user: ${user_id} exist!`);
    }

    const newBookRequest = await this.bookRequestService.createNewRequest(
      user_id,
      userBook_id,
    );
    const userBook = await this.userBooksModel.findById(userBook_id);
    userBook.request.push(newBookRequest._id);
    await userBook.save();
    return { _id: newBookRequest._id };
  }
}
