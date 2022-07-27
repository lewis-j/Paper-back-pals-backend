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

  async createNewRequest(requester_id: string, userBook_id: string) {
    const requestAsObjectId = new Types.ObjectId(requester_id);
    const userBookAsObjectId = new Types.ObjectId(userBook_id);
    const newBookRequest = new this.bookRequestModel({
      requester: requestAsObjectId,
      userBook: userBookAsObjectId,
    });
    return newBookRequest.save();
  }

  async doesRequestExist(user_id, userBook_id) {
    const isExistingUser = await this.bookRequestModel.findOne({
      $and: [{ requester: user_id }, { userBook: userBook_id }],
    });
    console.log('isExistingUser', isExistingUser);
    return isExistingUser;
  }
}
