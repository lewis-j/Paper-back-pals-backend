import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/CreateUserDto';
import { Users, UsersDocument } from './schema/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<UsersDocument>,
  ) {}

  async createNewUser(createUser: CreateUserDto) {
    const { userId, username, email } = createUser;
    const result = await this.userModel.findOne({ email: email }).exec();

    if (!result) {
      const createUser = new this.userModel({
        firebaseId: userId,
        username: username,
        email: email,
      });
      await createUser.save();
      return 'New User was created';
    }
    return 'User already exist';
  }
}
