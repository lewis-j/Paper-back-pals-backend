import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BookRequest, BookRequestDocument } from './schema/bookRequest.schema';

@Injectable()
export class BookRequestService {
  constructor(
    @InjectModel(BookRequest.name)
    private readonly bookRequestModel: Model<BookRequestDocument>,
  ) {}

  async createNewRequest(sender_id: string, userBook_id: string, session) {
    const senderAsObjectId = new Types.ObjectId(sender_id);
    const userBookAsObjectId = new Types.ObjectId(userBook_id);
    const newBookRequest = new this.bookRequestModel({
      sender: senderAsObjectId,
      userBook: userBookAsObjectId,
    });
    return newBookRequest.save({ session });
  }

  async doesRequestExist(user_id: string, userBook_id: string) {
    const isExistingUser = await this.bookRequestModel.findOne({
      $and: [{ sender: user_id }, { userBook: userBook_id }],
    });
    console.log('isExistingUser', isExistingUser);
    return isExistingUser;
  }

  async getBookRequest(request_id: string) {
    return this.bookRequestModel.findById(request_id, null, {
      populate: { path: 'userBook', populate: 'book' },
    });
  }
}
