import { Injectable } from '@nestjs/common';
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

    return JSON.stringify(newUserBook._id);
  }

  async getUserBooks(user_id: string) {
    const userId = new Types.ObjectId(user_id);
    const ownedBooks = await this.userBooksModel
      .find({ owner: userId })
      .select('-updatedAt -createdAt')
      .populate('book')
      .populate('recipient')
      .exec();
    const borrowedBooks = await this.userBooksModel
      .find({ recipient: userId })
      .select('-updatedAt -createdAt')
      .populate('owner')
      .populate('book')
      .exec();
      console.log("Owned Books",ownedBooks);
    return {
      owned: ownedBooks,
      borrowed: borrowedBooks,
    };
  }
}
