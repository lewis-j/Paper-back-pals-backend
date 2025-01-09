import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import { UserBooks, UserBooksDocument } from './schema/userbooks.schema';
import { BooksService } from 'src/books/books.service';
import { createBookDto } from 'src/books/dto/createBookDto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { requestTypeEnum } from 'src/notifications/dto/CreateNotificationDto';
import { BookRequest, BookRequestDocument } from './schema/bookRequest.schema';
import {
  BookRequestStatus,
  bookRequestStatus,
  dueStatus,
} from './schema/status-enums';
import {
  bookRequestPopulateOptions,
  transformBookRequest,
} from 'src/util/populate.utils';
import { bookRequestStateMachine } from './state-machine/book-request.state-machine';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

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
    private cloudinaryService: CloudinaryService,
  ) {}

  // CRUD Operations
  public async createUserBook(user_id: string, book: createBookDto) {
    try {
      const book_id = await this.bookService.createBook(book);
      const userId = new Types.ObjectId(user_id);
      const userBook = new this.userBooksModel({
        book: book_id,
        owner: userId,
      });
      const newUserBook = await userBook.save();
      return newUserBook.populate(['book', 'owner']);
    } catch (error) {
      console.error('Failed to create user book:', error);
      throw new BadRequestException('Failed to create user book');
    }
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

  // Request Operations
  public async getBookRequest(request_id: string) {
    try {
      return await this.bookRequestModel.findById(request_id, null, {
        populate: { path: 'userBook', populate: 'book' },
      });
    } catch (error) {
      console.error('Failed to get book request:', error);
      throw new BadRequestException('Failed to get book request');
    }
  }

  public async createBookRequest(user_id: string, userBook_id: string) {
    const existingRequest = await this.doesRequestExist(user_id, userBook_id);

    // If there's an existing active request that's not RETURNED
    if (
      existingRequest &&
      existingRequest.status !== bookRequestStatus.RETURNED
    ) {
      if (existingRequest.status === bookRequestStatus.CANCELED_BY_SENDER) {
        // Reuse canceled request by resetting its status
        existingRequest.updateStatus({
          status: bookRequestStatus.CHECKED_IN,
        });
        return this.processBookRequest(existingRequest, userBook_id);
      } else {
        // Other active request exists
        throw new ConflictException(
          `book request from user: ${user_id} exists!`,
        );
      }
    }

    // Create new request for RETURNED status or no existing request
    const newBookRequest = await this.createNewRequest(user_id, userBook_id);
    return this.processBookRequest(newBookRequest, userBook_id);
  }

  private async processBookRequest(
    bookRequest: BookRequestDocument,
    userBook_id: string,
  ) {
    const session = await this.connection.startSession();

    try {
      const result = await this.withTransaction(session, async (_session) => {
        const savedRequest = await bookRequest.save({ session: _session });

        const populateOptionsWithSender = {
          ...bookRequestPopulateOptions,
          select: `${bookRequestPopulateOptions.select} sender`,
        };

        await savedRequest.populate(populateOptionsWithSender);
        const transformedRequest = transformBookRequest(savedRequest);

        const userBook = await this.userBooksModel.findOneAndUpdate(
          { _id: userBook_id },
          { $push: { requests: savedRequest._id } },
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

        const notificationPayload = await this.getPayloadFromBookRequest(
          savedRequest,
        );

        const [newNotification] =
          await this.notificationsService.createNotificationForTwoUsers(
            notificationPayload,
          );

        return {
          bookRequest: transformedRequest,
          notification: await newNotification.populate('user'),
        };
      });
      return result;
    } finally {
      session.endSession();
    }
  }

  public async requestReturn(
    request_id: string,
    user_id: string,
    status: string,
  ) {
    try {
      const bookRequest = (await this.bookRequestModel
        .findOne({ _id: request_id })
        .populate({
          path: 'userBook',
          select: 'owner',
        })
        .lean(false)
        .exec()) as BookRequestDocument;

      if (!bookRequest) {
        throw new NotFoundException('Book request not found');
      }

      if (bookRequest.status !== bookRequestStatus.CHECKED_OUT) {
        throw new BadRequestException(
          'Book request is not in the CHECKED_OUT status',
        );
      }

      if (bookRequest.userBook.owner.toString() !== user_id) {
        throw new UnauthorizedException('Only the Lender can request a return');
      }

      bookRequest.updateStatus({
        status: bookRequestStatus.RETURN_REQUESTED,
      });

      const request = await bookRequest.save();
      const notificationPayload = await this.getPayloadFromBookRequest(request);

      const [senderNotification, recipientNotification] =
        await this.notificationsService.createNotificationForTwoUsers(
          notificationPayload,
        );
      return {
        bookRequest: request,
        notification: await senderNotification.populate('user'),
      };
    } catch (error) {
      console.error('error', error);
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to process return request');
    }
  }

  public async getReturnedBooks(user_id: string) {
    const [borrowedBooks, lentBooks] = await Promise.all([
      // Books the user borrowed
      this.bookRequestModel
        .find({
          status: bookRequestStatus.RETURNED,
          sender: new Types.ObjectId(user_id),
        })
        .populate([
          {
            path: 'userBook',
            populate: [
              { path: 'book' },
              { path: 'owner', select: '_id username profilePic' },
            ],
          },
          {
            path: 'sender',
            select: '_id name',
          },
        ])
        .then((borrowedBooks) => borrowedBooks.map(transformBookRequest)),

      // Books the user lent
      this.bookRequestModel
        .find({
          status: bookRequestStatus.RETURNED,
        })
        .populate([
          {
            path: 'userBook',
            match: { owner: new Types.ObjectId(user_id) },
            populate: [{ path: 'book' }, { path: 'owner', select: '_id name' }],
          },
          {
            path: 'sender',
            select: '_id username profilePic',
          },
        ])
        .then((requests) => requests.filter((request) => request.userBook)),
    ]);

    return { borrowedBooks, lentBooks };
  }

  private async createNewRequest(sender_id: string, userBook_id: string) {
    const senderAsObjectId = new Types.ObjectId(sender_id);
    const userBookAsObjectId = new Types.ObjectId(userBook_id);
    return new this.bookRequestModel({
      sender: senderAsObjectId,
      userBook: userBookAsObjectId,
    });
  }

  public async deleteBookRequest(request_id: string, user_id: string) {
    const bookRequest = await this.bookRequestModel
      .findById(request_id)
      .populate('userBook');

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

  public async nextRequestStatus(
    request_id: string,
    user_id: string,
    nextStatus: string,
    imageFile?: Express.Multer.File,
  ) {
    const bookRequest = await this.bookRequestModel
      .findById(request_id)
      .populate('userBook');

    if (!bookRequest) {
      throw new NotFoundException('Request not found');
    }

    if (!bookRequestStateMachine.isValidStatus(nextStatus)) {
      throw new BadRequestException('Invalid status provided');
    }

    const userRole =
      bookRequest.userBook.owner.toString() === user_id ? 'owner' : 'sender';

    if (
      !bookRequestStateMachine.canTransition(
        bookRequest.status as BookRequestStatus,
        nextStatus as BookRequestStatus,
        userRole,
        bookRequest,
        imageFile,
      )
    ) {
      throw new BadRequestException(
        `Invalid status transition from ${bookRequest.status} to ${nextStatus} for ${userRole}`,
      );
    }

    const session = await this.connection.startSession();

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await this.cloudinaryService.uploadImage(imageFile);
      }

      const result = await this.withTransaction(session, async (_session) => {
        // Update status with image if provided
        bookRequest.updateStatus({
          status: nextStatus,
          imageUrl: imageUrl || undefined,
        });

        // Set due date if checking out
        if (nextStatus === bookRequestStatus.CHECKED_OUT) {
          bookRequest.dueDate = new Date(
            +new Date() + 30 * 24 * 60 * 60 * 1000,
          );
        }

        const _bookRequest = await bookRequest.save({ session: _session });
        const notificationPayload = await this.getPayloadFromBookRequest(
          _bookRequest,
        );

        const [senderNotification, recipientNotification] =
          await this.notificationsService.createNotificationForTwoUsers(
            notificationPayload,
          );

        // Return appropriate notification based on who made the update

        return {
          notification: await (userRole === 'sender'
            ? senderNotification
            : recipientNotification
          ).populate('user'),
          bookRequest: _bookRequest,
        };
      });
      return result;
    } finally {
      session.endSession();
    }
  }

  public async declineBookRequest(request_id: string, user_id: string) {
    const bookRequest = await this.bookRequestModel
      .findById(request_id)
      .populate('userBook')
      .exec();

    if (!bookRequest) {
      throw new NotFoundException('Book request not found');
    }

    // Ensure only the book owner can decline requests
    if (bookRequest.userBook.owner.toString() !== user_id) {
      throw new UnauthorizedException(
        'Only the book owner can decline requests',
      );
    }

    bookRequest.updateStatus({
      status: bookRequestStatus.DECLINED_BY_OWNER,
    });
    const userBook = await this.userBooksModel.findById(bookRequest.userBook);
    userBook.requests = userBook.requests.filter(
      (request) => request.toString() !== request_id,
    );

    const session = await this.connection.startSession();

    try {
      const result = await this.withTransaction(session, async (_session) => {
        await userBook.save({ session: _session });
        const savedRequest = await bookRequest.save({ session: _session });

        const notificationPayload = await this.getPayloadFromBookRequest(
          savedRequest,
          bookRequestStatus.DECLINED_BY_OWNER,
        );

        const [senderNotification, recipientNotification] =
          await this.notificationsService.createNotificationForTwoUsers(
            notificationPayload,
          );

        // Return recipient's (owner's) notification since they declined it
        return {
          bookRequest: savedRequest,
          notification: await recipientNotification.populate('user'),
        };
      });
      return result;
    } finally {
      session.endSession();
    }
  }

  public async cancelBookRequest(request_id: string, user_id: string) {
    const bookRequest = await this.bookRequestModel.findById(request_id).exec();

    if (!bookRequest) {
      throw new NotFoundException('Book request not found');
    }

    // Ensure only the sender can cancel their request
    if (bookRequest.sender.toString() !== user_id) {
      throw new UnauthorizedException(
        'Only the requester can cancel their request',
      );
    }

    bookRequest.updateStatus({
      status: bookRequestStatus.CANCELED_BY_SENDER,
    });
    const userBook = await this.userBooksModel.findById(bookRequest.userBook);
    userBook.requests = userBook.requests.filter(
      (request) => request.toString() !== request_id,
    );

    const session = await this.connection.startSession();

    try {
      const result = await this.withTransaction(session, async (_session) => {
        await userBook.save({ session: _session });
        const savedRequest = await bookRequest.save({ session: _session });

        const notificationPayload = await this.getPayloadFromBookRequest(
          savedRequest,
          bookRequestStatus.CANCELED_BY_SENDER,
        );

        const [senderNotification, recipientNotification] =
          await this.notificationsService.createNotificationForTwoUsers(
            notificationPayload,
          );

        // Return sender's notification since they canceled it
        return {
          bookRequest: savedRequest,
          notification: await senderNotification.populate('user'),
        };
      });
      return result;
    } finally {
      session.endSession();
    }
  }

  public async updatePageCount(request_id: string, pageCount: number) {
    try {
      const bookRequest = await this.bookRequestModel.findById(request_id);
      if (!bookRequest) {
        throw new NotFoundException('Book request not found');
      }
      bookRequest.currentPage = pageCount;
      return await bookRequest.save();
    } catch (error) {
      console.error('Failed to update page count:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update page count');
    }
  }

  public async updatePictureRequired(
    request_id: string,
    pictureRequired: boolean,
  ) {
    const bookRequest = await this.bookRequestModel.findById(request_id);
    bookRequest.pictureRequired = pictureRequired;
    return await bookRequest.save();
  }

  public async getPayloadFromBookRequest(
    bookRequest: BookRequestDocument,
    optionalStatus: string = null,
  ) {
    await bookRequest.populate({
      path: 'userBook',
      populate: { path: 'book', select: 'title' },
      select: 'book owner',
    });
    const status = optionalStatus ?? bookRequest.status;

    const { userBook } = bookRequest;
    const requestPayload = {
      requestType: requestTypeEnum['BookRequest'],
      requestRef: bookRequest._id.toString(),
      status,
    };
    const [sender, recipient] = this.getUserBookNotificationPayload(
      status,
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

  // Utility Operations
  public async checkDueBooks() {
    const now = new Date();
    const threeDaysBefore = new Date(now);
    threeDaysBefore.setHours(0, 0, 0, 0);
    threeDaysBefore.setDate(now.getDate() + 3);

    const session = await this.connection.startSession();

    try {
      await this.withTransaction(session, async (_session) => {
        const dueRequests = await this.bookRequestModel
          .find({
            status: bookRequestStatus.CHECKED_OUT,
            dueDate: { $lte: threeDaysBefore },
          })
          .populate({
            path: 'userBook',
            populate: { path: 'book', select: 'title' },
          });

        for (const request of dueRequests) {
          if (!request.dueDate) continue;

          const daysUntilDue = Math.ceil(
            (request.dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24),
          );

          let notificationType;
          if (daysUntilDue <= 0) {
            notificationType = bookRequestStatus.IS_DUE;
          } else if (daysUntilDue === 1) {
            notificationType = dueStatus.DUE_TOMORROW;
          } else if (daysUntilDue <= 3) {
            notificationType = dueStatus.DUE_SOON;
          }

          if (notificationType) {
            try {
              const notificationPayload = await this.getPayloadFromBookRequest(
                request,
                notificationType,
              );
              await this.notificationsService.createNotificationForTwoUsers(
                notificationPayload,
              );
            } catch (error) {
              console.error(
                `Failed to create notification for request ${request._id}:`,
                error,
              );
            }
          }
        }
      });
    } finally {
      session.endSession();
    }
  }

  private getUserBookNotificationPayload(status, title, dueDate) {
    let sender, recipient;

    switch (status) {
      case bookRequestStatus.CHECKED_IN:
        sender = {
          message: `You made a book request for ${title}`,
        };
        recipient = {
          message: `You have a book request for ${title}`,
          confirmation: `Accept the book request for ${title}?`,
        };
        break;
      case bookRequestStatus.ACCEPTED:
        sender = {
          message: `Your book request for "${title}" was accepted! Waiting for dropoff`,
        };
        recipient = {
          message: `You accepted a book request for "${title}"! Confirm Dropoff`,
          confirmation: `Confirm that you've dropped off "${title}"`,
        };
        break;

      case bookRequestStatus.SENDING:
        sender = {
          message: `"${title}" was dropped off! Confirm pickup!`,
          confirmation: `Confirm that you've picked up "${title}"`,
        };
        recipient = {
          message: `You dropped off "${title}!". Waiting for pickup confirmation`,
        };
        break;

      case bookRequestStatus.CHECKED_OUT:
        sender = {
          message: `"${title}" is checked out! Your due date is ${new Intl.DateTimeFormat(
            'en',
            { dateStyle: 'medium' },
          ).format(dueDate)}`,
        };
        recipient = {
          message: `Your book "${title}!" is now checked out! Expected return date is ${new Intl.DateTimeFormat(
            'en',
            { dateStyle: 'medium' },
          ).format(dueDate)}`,
        };
        break;

      case bookRequestStatus.IS_DUE:
        sender = {
          message: `"${title}" is now due! Confirm drop off!`,
          confirmation: `Confirm that you've dropped off "${title}"`,
        };
        recipient = {
          message: `"${title}" is now due! Waiting for drop off!`,
        };
        break;

      case bookRequestStatus.RETURNING:
        sender = {
          message: `You returned "${title}"! Waiting for pickup confirmation!`,
        };
        recipient = {
          message: `Your book "${title}!" was returned. Confirm pickup`,
          confirmation: `Confirm that you've received "${title}" back`,
        };
        break;

      case bookRequestStatus.RETURNED:
        sender = {
          message: `"${title}" was returned!`,
        };
        recipient = {
          message: `"${title}" was returned!`,
        };
        break;

      case dueStatus.DUE_SOON:
        sender = {
          message: `"${title}" is due soon!`,
        };
        recipient = {
          message: `"${title}" is due soon!`,
        };
        break;

      case dueStatus.DUE_TOMORROW:
        sender = {
          message: `"${title}" is due tomorrow!`,
        };
        recipient = {
          message: `"${title}" is due tomorrow!`,
        };
        break;

      case bookRequestStatus.DECLINED_BY_OWNER:
        sender = {
          message: `Your book request for "${title}" was declined by the owner`,
        };
        recipient = {
          message: `You declined the book request for "${title}"`,
        };
        break;

      case bookRequestStatus.CANCELED_BY_SENDER:
        sender = {
          message: `You canceled your request for "${title}"`,
        };
        recipient = {
          message: `The request for "${title}" was canceled by the requester`,
        };
        break;

      case bookRequestStatus.RETURN_REQUESTED:
        sender = {
          message: `You requested "${title}" to be returned`,
        };
        recipient = {
          message: `The owner has requested "${title}" to be returned`,
        };
        break;

      case 'RETURN_REQUEST_CANCELED':
        sender = {
          message: `You canceled the return request for "${title}"`,
        };
        recipient = {
          message: `The return request for "${title}" was canceled by the owner`,
        };
        break;

      default:
        throw new Error(`Unhandled book request status: ${status}`);
    }

    return [sender, recipient];
  }

  // Private Helper Methods
  private async doesRequestExist(user_id: string, userBook_id: string) {
    const isExistingUser = await this.bookRequestModel.findOne({
      $and: [{ sender: user_id }, { userBook: userBook_id }],
    });
    return isExistingUser;
  }

  private async withTransaction(session, closure) {
    let result;
    await session.withTransaction(async () => {
      result = await closure(session);
      return result;
    });
    return result;
  }

  public async cancelReturnRequest(
    request_id: string,
    user_id: string,
    status: string,
  ) {
    try {
      const bookRequest = await this.bookRequestModel
        .findById(request_id)
        .populate({
          path: 'userBook',
          select: 'owner',
        })
        .exec();

      if (!bookRequest) {
        throw new NotFoundException('Book request not found');
      }

      if (bookRequest.status !== bookRequestStatus.RETURN_REQUESTED) {
        throw new BadRequestException(
          'Book request is not in the RETURN_REQUESTED status',
        );
      }

      if (bookRequest.userBook.owner.toString() !== user_id) {
        throw new UnauthorizedException(
          'Only the Lender can cancel a return request',
        );
      }

      bookRequest.updateStatus({
        status: bookRequestStatus.CHECKED_OUT,
      });

      const request = await bookRequest.save();
      const notificationPayload = await this.getPayloadFromBookRequest(
        request,
        'RETURN_REQUEST_CANCELED',
      );

      const [senderNotification, recipientNotification] =
        await this.notificationsService.createNotificationForTwoUsers(
          notificationPayload,
        );
      return {
        bookRequest: request,
        notification: await senderNotification.populate('user'),
      };
    } catch (error) {
      console.error('error', error);
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to cancel return request');
    }
  }

  public async getAllBookRequests(user_id: string) {
    return await this.bookRequestModel
      .find({
        $or: [
          { sender: new Types.ObjectId(user_id) },
          { 'userBook.owner': new Types.ObjectId(user_id) },
        ],
      })
      .select('statusHistory')
      .populate({
        path: 'sender',
        select: '_id username profilePic',
      });
  }

  public async addImageToStatus(
    request_id: string,
    status: string,
    imageUrl: string,
  ) {
    const bookRequest = await this.bookRequestModel.findById(request_id);
    if (!bookRequest) {
      throw new NotFoundException('Book request not found');
    }

    // Find the specific status history entry
    const statusEntry = bookRequest.statusHistory.find(
      (entry) => entry.status === status,
    );
    if (!statusEntry) {
      throw new BadRequestException(
        `No status history entry found for status: ${status}`,
      );
    }

    // Add the image URL to the status entry
    statusEntry.imageUrl = imageUrl;

    return await bookRequest.save();
  }
}
