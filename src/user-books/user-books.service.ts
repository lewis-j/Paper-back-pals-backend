import { ConflictException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { UserBooks, UserBooksDocument } from './schema/userbooks.schema';
import { BooksService } from 'src/books/books.service';
import { createBookDto } from 'src/books/dto/createBookDto';
import { BookRequestService } from 'src/book-request/book-request.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { requestTypeEnum } from 'src/notifications/dto/CreateNotificationDto';

@Injectable()
export class UserBooksService {
  constructor(
    @InjectModel(UserBooks.name)
    private readonly userBooksModel: Model<UserBooksDocument>,
    private bookService: BooksService,
    private bookRequestService: BookRequestService,
    private notificationsService: NotificationsService,
    @InjectConnection() private connection: Connection,
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

  async getBookRequest(request_id: string) {
    return this.bookRequestService.getBookRequest(request_id);
  }

  async createBookRequest(user_id: string, userBook_id: string) {
    const user = await this.bookRequestService.doesRequestExist(
      user_id,
      userBook_id,
    );
    if (user) {
      throw new ConflictException(`book request from user: ${user_id} exist!`);
    }

    const session = await this.connection.startSession();

    const result = await this.withTransaction(session, async (_session) => {
      const newBookRequest = await this.bookRequestService.createNewRequest(
        user_id,
        userBook_id,
        _session,
      );

      const userBook = await this.userBooksModel.findOneAndUpdate(
        { _id: userBook_id },
        { $push: { request: newBookRequest._id } },
        {
          runValidators: true,
          session: _session,
          populate: [
            { path: 'owner', select: '_id' },
            { path: 'book', select: 'title' },
          ],
        },
      );

      const notificationPayload = {
        requestPayload: {
          requestType: requestTypeEnum['BookRequest'],
          requestRef: newBookRequest._id,
        },
        sender: {
          _id: user_id,
          message: `You made a book request for ${userBook.book.title}`,
          actionRequired: false,
        },
        recipient: {
          _id: userBook.owner._id,
          message: `You have a book request for ${userBook.book.title}`,
          actionRequired: true,
        },
      };
      console.log('notificationPayload:', notificationPayload);

      const newNotification =
        await this.notificationsService.createNotification(
          notificationPayload,
          _session,
        );

      return Promise.resolve({
        request_id: newBookRequest._id,
        notification: newNotification,
      });
    });
    session.endSession();
    return result;
  }

  private async withTransaction(session, closure) {
    let result;
    await session.withTransaction(() => {
      result = closure(session);
      return result;
    });
    return result;
  }
}
