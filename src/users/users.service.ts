import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/CreateUserDto';
import { FireBaseUser } from './dto/firebaseUserDto';
import { GoogleUserDto } from './dto/GoogleUserDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { Users, UsersDocument } from './schema/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<UsersDocument>,
  ) {}

  async getUserFromGoogle(firebaseUser: GoogleUserDto) {
    const { firebase_id: id } = firebaseUser;
    try {
      const existingUser = await this.userModel
        .findOne({ firebase_id: id })
        .exec();
      existingUser.getPublicField();
      if (existingUser) return await existingUser.getPublicField();

      const newUser = await this.userModel.create({ ...firebaseUser });
      const savedUser = await newUser.save();
      savedUser.getPublicField();

      return await savedUser.populate({
        path: 'friends',
        select: '-firebase_id, -email_verified -updatedAt -createdAt',
      });
    } catch (err) {
      return err;
    }
  }

  async createNewUser(firebaseData: FireBaseUser, createUser: CreateUserDto) {
    const { username, profilePic } = createUser;
    const { user_id, email, email_verified } = firebaseData;
    try {
      const existingUser = await this.userModel
        .findOne({ firebaseId: user_id })
        .exec();

      if (!existingUser) {
        const createUser = new this.userModel({
          firebase_Id: user_id,
          username,
          profilePic,
          email,
          email_verified,
        });
        const newUser = await createUser.save();
        return { _id: newUser._id };
      }
      return { _id: existingUser._id };
    } catch (error) {
      return error;
    }
  }
  async getUserById(_id) {
    try {
      const user = await this.userModel.findById(_id);
      return user;
    } catch (err) {
      throw new NotFoundException('User does not exist');
    }
  }

  async getUserByFirebaseId(_id) {
    try {
      const user = await this.userModel
        .findOne({ firebase_Id: _id })
        .select('-firebaseId -updatedAt -createdAt');

      if (!user) {
        throw new NotFoundException('User does not exist');
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

      if (!user) {
        throw new NotFoundException('User does not exist');
      }
      [...Object.keys(updatedUser)].map((property) => {
        user[`${property}`] = userData[`${property}`];
      });
      const { _id } = await user.save();
      return { _id };
    } catch (error) {
      return error;
    }
  }
}
