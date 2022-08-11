import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { UserBooks, UserBooksDocument } from './schema/userbooks.schema';
import { BooksService } from 'src/books/books.service';
import { createBookDto } from 'src/books/dto/createBookDto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { requestTypeEnum } from 'src/notifications/dto/CreateNotificationDto';
import { BookRequest, BookRequestDocument } from './schema/bookRequest.schema';
import { status as bookRequestStatus } from './schema/status-enums';

@Injectable()
export class UserBooksService {
  constructor(
    @InjectModel(UserBooks.name)
    private readonly userBooksModel: Model<UserBooksDocument>,
    @InjectModel(BookRequest.name)
    private readonly bookRequestModel: Model<BookRequestDocument>,
    private bookService: BooksService,
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
    return this.bookRequestModel.findById(request_id, null, {
      populate: { path: 'userBook', populate: 'book' },
    });
  }

  async doesRequestExist(user_id: string, userBook_id: string) {
    const isExistingUser = await this.bookRequestModel.findOne({
      $and: [{ sender: user_id }, { userBook: userBook_id }],
    });
    console.log('isExistingUser', isExistingUser);
    return isExistingUser;
  }

  async createNewRequest(sender_id: string, userBook_id: string, session) {
    const senderAsObjectId = new Types.ObjectId(sender_id);
    const userBookAsObjectId = new Types.ObjectId(userBook_id);
    const newBookRequest = new this.bookRequestModel({
      sender: senderAsObjectId,
      userBook: userBookAsObjectId,
    });
    return newBookRequest.save({ session });
  }

  async createBookRequest(user_id: string, userBook_id: string) {
    const user = await this.doesRequestExist(user_id, userBook_id);
    if (user) {
      throw new ConflictException(`book request from user: ${user_id} exist!`);
    }

    const session = await this.connection.startSession();

    const result = await this.withTransaction(session, async (_session) => {
      const newBookRequest = await this.createNewRequest(
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

  async nextRequestStatus(request_id: string, user_id: string) {
    const bookRequest = await this.bookRequestModel.findById(request_id);
    if (!bookRequest) throw new NotFoundException('The request does not exist');
    const session = await this.connection.startSession();
    const _statusEnum = Object.values(bookRequestStatus);
    const idx = _statusEnum.findIndex(
      (status) => status === bookRequest.status,
    );

    console.log('bookRequest', bookRequest);

    bookRequest.status = _statusEnum[idx + 1];
    return this.withTransaction(session, async (_session) => {
      // const _bookRequest = await bookRequest.save({ session: _session });
      const notificationPayload = await this.getPayloadFromBookRequest(
        bookRequest,
      );

      console.log('notificationPayload:', notificationPayload);

      // const newNotification =
      //   await this.notificationsService.createNotification(
      //     notificationPayload,
      //     _session,
      //   );
      // return newNotification;
    });
  }

  private async getPayloadFromBookRequest(bookRequest: BookRequestDocument) {
    await bookRequest.populate({
      path: 'userBook',
      populate: { path: 'book', select: 'title' },
      select: 'book owner',
    });
    console.log('populated bookRequest', bookRequest);
    const { userBook } = bookRequest;
    const requestPayload = {
      requestType: requestTypeEnum['BookRequest'],
      requestRef: bookRequest._id,
    };
    const defaultPayload = {
      sender: {
        _id: bookRequest.sender,
      },
      recipient: {
        _id: userBook.owner,
      },
    };
    console.log('bookRequest.status:', bookRequest.status);

    const [sender, recipient] = this.getUserBookNotificationPayload(
      bookRequest.status,
      userBook.book.title,
    );

    console.log('sender:', sender);
    console.log('recipient:', recipient);

    return {
      requestPayload,
      sender: { ...defaultPayload.sender, ...sender },
      recipient: {
        ...defaultPayload.recipient,
        ...recipient,
      },
    };
  }

  private getUserBookNotificationPayload(status, title) {
    return {
      [bookRequestStatus.ACCEPTED]: [
        {
          message: `Your book request for "${title}" was accepted!`,
          actionRequired: true,
        },
        {
          message: `You accepted a book request for "${title}"!`,
          actionRequired: false,
        },
      ],
      [bookRequestStatus.SENDING]: [
        {
          message: `"${title}" is on its way! Waiting for drop off!`,
          actionRequired: false,
        },
        {
          message: `Confirm drop off of your book "${title}!"`,
          actionRequired: true,
        },
      ],
    }[status];
  }

  private async withTransaction(session, closure) {
    let result;
    await session.withTransaction(async () => {
      result = await closure(session);
      return result;
    });
    return result;
  }
}
