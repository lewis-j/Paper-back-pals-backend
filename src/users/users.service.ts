import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/CreateUserDto';
import { FireBaseUser } from './dto/firebaseUserDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { Users, UsersDocument } from './schema/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<UsersDocument>,
  ) {}

  async createNewUser(firebaseData: FireBaseUser, createUser: CreateUserDto) {
    const { username, profilePicture } = createUser;
    const { user_id, email, email_verified } = firebaseData;
    try {
      const existingUser = await this.userModel
        .findOne({ firebaseId: user_id })
        .exec();

      if (!existingUser) {
        const createUser = new this.userModel({
          firebaseId: user_id,
          username,
          profilePicture,
          email,
          email_verified,
        });
        const newUser = await createUser.save();
        return newUser;
      }
      return existingUser;
    } catch (error) {
      return error;
    }
  }

  async getOneUser(_id) {
    try {
      const user = await this.userModel.findOne({ firebaseId: _id }).select('-firebaseId -updatedAt -createdAt');
      if (!user) {
        throw new Error('User was not found');
      }
      return user;
    } catch (error) {
      return error;
    }
  }
  async updateUser(firebaseData: FireBaseUser, updatedUser: UpdateUserDto) {
    const { user_id, email, email_verified } = firebaseData;
    try {
      const user = await this.userModel.findOne({
        firebaseId: user_id,
      });
      const userData = { ...updatedUser, email, email_verified };
      console.log('user', updatedUser);

      if (!user) {
        throw new Error('User was not found');
      }
      [...Object.keys(updatedUser)].map((property) => {
        console.log('properties', property);
        user[`${property}`] = userData[`${property}`];
      });
      return await user.save();
    } catch (error) {
      return error;
    }
  }
}
