import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
import {
  bookRequestPopulateOptions,
  transformBookRequest,
} from 'src/util/populate.utils';

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

  public async createUserBook(user_id: string, book: createBookDto) {
    const book_id = await this.bookService.createBook(book);

    const userId = new Types.ObjectId(user_id);

    const userBook = new this.userBooksModel({
      book: book_id,
      owner: userId,
    });
    const newUserBook = await userBook.save();
    return newUserBook.populate(['book', 'owner']);
  }

  public async getBookRequest(request_id: string) {
    return this.bookRequestModel.findById(request_id, null, {
      populate: { path: 'userBook', populate: 'book' },
    });
  }

  private async doesRequestExist(user_id: string, userBook_id: string) {
    const isExistingUser = await this.bookRequestModel.findOne({
      $and: [{ sender: user_id }, { userBook: userBook_id }],
    });
    return isExistingUser;
  }

  private async createNewRequest(
    sender_id: string,
    userBook_id: string,
    session,
  ) {
    const senderAsObjectId = new Types.ObjectId(sender_id);
    const userBookAsObjectId = new Types.ObjectId(userBook_id);
    const newBookRequest = new this.bookRequestModel({
      sender: senderAsObjectId,
      userBook: userBookAsObjectId,
    });
    return newBookRequest.save({ session });
  }

  public async deleteBookRequest(request_id: string, user_id: string) {
    const bookRequest = await this.bookRequestModel
      .findById(request_id)
      .populate('userBook');

    console.log('bookRequest', bookRequest);

    if (!bookRequest) {
      throw new NotFoundException('Book request not found');
    }

    // Check if user is authorized to delete the request
    if (
      bookRequest.sender.toString() !== user_id &&
      bookRequest.userBook.owner.toString() !== user_id
    ) {
      throw new UnauthorizedException('Not authorized to delete this request');
    }

    const session = await this.connection.startSession();

    try {
      const result = await this.withTransaction(session, async (_session) => {
        //Remove request reference from userBook
        await this.userBooksModel.updateOne(
          { _id: bookRequest.userBook },
          { $pull: { requests: request_id } },
          { session: _session },
        );

        await bookRequest.deleteOne({ session: _session });

        return { message: 'Book request successfully deleted' };
      });

      return result;
    } finally {
      session.endSession();
    }
  }

  public async createBookRequest(user_id: string, userBook_id: string) {
    const user = await this.doesRequestExist(user_id, userBook_id);
    if (user) {
      throw new ConflictException(`book request from user: ${user_id} exist!`);
    }

    const session = await this.connection.startSession();

    try {
      const result = await this.withTransaction(session, async (_session) => {
        const newBookRequest = await this.createNewRequest(
          user_id,
          userBook_id,
          _session,
        );

        const populateOptionsWithSender = {
          ...bookRequestPopulateOptions,
          select: `${bookRequestPopulateOptions.select} sender`,
        };

        await newBookRequest.populate(populateOptionsWithSender);
        console.log('newBookRequest', newBookRequest);
        const transformedRequest = transformBookRequest(newBookRequest);

        const userBook = await this.userBooksModel.findOneAndUpdate(
          { _id: userBook_id },
          { $push: { requests: newBookRequest._id } },
          {
            runValidators: true,
            session: _session,
            populate: [
              { path: 'owner', select: '_id' },
              { path: 'book', select: 'title' },
            ],
          },
        );

        if (!userBook) {
          throw new NotFoundException('UserBook not found');
        }

        const notificationPayload = {
          requestPayload: {
            requestType: requestTypeEnum['BookRequest'],
            requestRef: newBookRequest._id.toString(),
          },
          sender: {
            _id: user_id.toString(),
            message: `You made a book request for ${userBook.book.title}`,
          },
          recipient: {
            _id: userBook.owner._id.toString(),
            message: `You have a book request for ${userBook.book.title}`,
            confirmation: `Accept the book request for ${userBook.book.title}?`,
          },
        };

        const [newNotification] =
          await this.notificationsService.createNotification(
            notificationPayload,
            _session,
          );

        return Promise.resolve({
          bookRequest: transformedRequest,
          notification: await newNotification.populate('user'),
        });
      });
      return result;
    } finally {
      session.endSession();
    }
  }

  public async nextRequestStatus(
    request_id: string,
    user_id: string,
    nextStatus: string,
  ) {
    const bookRequest = await this.bookRequestModel.findById(request_id);
    if (!bookRequest) throw new NotFoundException('The request does not exist');
    const session = await this.connection.startSession();
    const _statusEnum = Object.values(bookRequestStatus);
    const idx = _statusEnum.findIndex(
      (status) => status === bookRequest.status,
    );

    const _status = _statusEnum[idx + 1];

    if (_status !== nextStatus) throw new BadRequestException('Invalid status');
    bookRequest.status = _status;
    if (_status === bookRequestStatus.CHECKED_OUT) {
      bookRequest.dueDate = new Date(+new Date() + 30 * 24 * 60 * 60 * 1000);
    }
    const result = await this.withTransaction(session, async (_session) => {
      const _bookRequest = await bookRequest.save({ session: _session });

      const notificationPayload = await this.getPayloadFromBookRequest(
        _bookRequest,
      );

      const [senderNotification, recipientNotification] =
        await this.notificationsService.createNotification(
          notificationPayload,
          _session,
        );

      if (_bookRequest.sender._id.toString() === user_id)
        return {
          notification: await senderNotification.populate('user'),
          bookRequest: _bookRequest,
        };

      return {
        notification: await recipientNotification.populate('user'),
        bookRequest: _bookRequest,
      };
    });
    session.endSession();

    return result;
  }
  public async updatePageCount(request_id: string, pageCount: number) {
    console.log(
      'request id and pagecount in user books service',
      request_id,
      pageCount,
    );
    const bookRequest = await this.bookRequestModel.findById(request_id);
    bookRequest.currentPage = pageCount;
    return await bookRequest.save();
  }

  private async getPayloadFromBookRequest(bookRequest: BookRequestDocument) {
    await bookRequest.populate({
      path: 'userBook',
      populate: { path: 'book', select: 'title' },
      select: 'book owner',
    });

    const { userBook } = bookRequest;
    const requestPayload = {
      requestType: requestTypeEnum['BookRequest'],
      requestRef: bookRequest._id.toString(),
    };

    const [sender, recipient] = this.getUserBookNotificationPayload(
      bookRequest.status,
      userBook.book.title,
      bookRequest.dueDate,
    );

    return {
      requestPayload,
      sender: { _id: bookRequest.sender._id.toString(), ...sender },
      recipient: {
        _id: userBook.owner._id.toString(),
        ...recipient,
      },
    };
  }

  private getUserBookNotificationPayload(status, title, dueDate) {
    const [sender, recipient] = {
      [bookRequestStatus.ACCEPTED]: [
        {
          message: `Your book request for "${title}" was accepted! Waiting for dropoff`,
        },
        {
          message: `You accepted a book request for "${title}"! Confirm Dropoff`,
          confirmation: `Confirm that you've dropped off "${title}"`,
        },
      ],
      [bookRequestStatus.SENDING]: [
        {
          message: `"${title}" was dropped off! Confirm pickup!`,
          confirmation: `Confirm that you've picked up "${title}"`,
        },
        {
          message: `You dropped off "${title}!". Waiting for pickup confirmation`,
        },
      ],
      [bookRequestStatus.CHECKED_OUT]: [
        {
          message: ((date) =>
            `"${title}" is checked out! Your due date is ${new Intl.DateTimeFormat(
              'en',
              {
                dateStyle: 'medium',
              },
            ).format(date)}`)(dueDate),
        },
        {
          message: ((date) =>
            `Your book "${title}!" is now checked out! Expected return date is ${new Intl.DateTimeFormat(
              'en',
              {
                dateStyle: 'medium',
              },
            ).format(date)}`)(dueDate),
        },
      ],
      [bookRequestStatus.IS_DUE]: [
        {
          message: `"${title}" is now due! Confirm drop off!`,
          confirmation: `Confirm that you're ready to return "${title}"`,
        },
        {
          message: `"${title}" is now due! Waiting for drop off!`,
        },
      ],
      [bookRequestStatus.RETURNING]: [
        {
          message: `You dropped off "${title}"! Waiting for pickup confirmation!`,
        },
        {
          message: `Your book "${title}!" was dropped off. Confirm pickup`,
          confirmation: `Confirm that you've received "${title}" back`,
        },
      ],
      [bookRequestStatus.RETURNED]: [
        {
          message: `"${title}" was returned!`,
        },
        {
          message: `"${title}" was returned!`,
        },
      ],
    }[status];
    return [sender, recipient];
  }

  private async withTransaction(session, closure) {
    let result;
    await session.withTransaction(async () => {
      result = await closure(session);
      return result;
    });
    return result;
  }

  public async deleteUserBook(user_id: string, userbook_id: string) {
    const userBook = await this.userBooksModel.findOne({
      _id: userbook_id,
      owner: user_id,
    });

    if (!userBook) {
      throw new NotFoundException('UserBook not found or unauthorized');
    }

    // Check if book has active requests
    const activeRequests = await this.bookRequestModel.find({
      userBook: userbook_id,
      status: {
        $nin: [bookRequestStatus.RETURNED, bookRequestStatus.CHECKED_IN],
      },
    });

    if (activeRequests.length > 0) {
      throw new ConflictException('Cannot delete book with active requests');
    }

    const session = await this.connection.startSession();

    const result = await this.withTransaction(session, async (_session) => {
      // Delete completed requests
      await this.bookRequestModel.deleteMany(
        {
          userBook: userbook_id,
          status: {
            $in: [bookRequestStatus.RETURNED, bookRequestStatus.CHECKED_IN],
          },
        },
        { session: _session },
      );

      await userBook.deleteOne({ session: _session });

      return { message: 'UserBook successfully deleted' };
    });

    session.endSession();
    return result;
  }
}
