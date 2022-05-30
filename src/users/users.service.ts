import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFireUserDto } from './dto/CreateFireUserDto';
import { CreateUserDto } from './dto/CreateUserDto';
import { FireBaseUserDto } from './dto/FireBaseUserDto';
import { GoogleUserDto } from './dto/GoogleUserDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { Users, UsersDocument } from './schema/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<UsersDocument>,
  ) {}

  async fetchOrCreateUser(firebaseUser: GoogleUserDto) {
    const { firebase_id: id } = firebaseUser;
    try {
      throw new Error('User not not found');
      const existingUser = await this.userModel
        .findOne({ firebase_id: id })
        .exec();
      if (existingUser) return existingUser;
      return await this.userModel.create(firebaseUser);
    } catch (err) {
      throw new NotFoundException(err);
    }
  }

  // async createNewUser(
  //   firebaseData: CreateFireUserDto,
  //   createUser: CreateUserDto,
  // ) {
  //   const { username, profilePic } = createUser;
  //   const { firebase_id, email, email_verified } = firebaseData;
  //   try {
  //     const existingUser = await this.userModel
  //       .findOne({ firebaseId: firebase_id })
  //       .exec();

  //     if (!existingUser) {
  //       const createUser = new this.userModel({
  //         firebase_id,
  //         username,
  //         profilePic,
  //         email,
  //         email_verified,
  //       });
  //       const newUser = await createUser.save();
  //       console.log('new user', newUser);
  //       return newUser;
  //     }
  //     console.log('Existing user', existingUser);
  //     return existingUser;
  //   } catch (error) {
  //     return error;
  //   }
  // }

  async createUserFromFireUser(firebaseUser: FireBaseUserDto) {
    try {
      const user = new this.userModel(firebaseUser);
      return await user.save();
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

  async getUserByFirebaseId(firebase_id) {
    try {
      const user = await this.userModel
        .findOne({ firebase_id: firebase_id })
        .select('-firebaseId -updatedAt -createdAt');

      if (!user) {
        throw new NotFoundException('User does not exist');
      }

      return user;
    } catch (error) {
      return error;
    }
  }
  async updateUser(
    firebaseData: CreateFireUserDto,
    updatedUser: UpdateUserDto,
  ) {
    const { firebase_id, email, email_verified } = firebaseData;
    try {
      const user = await this.userModel.findOne({
        firebaseId: firebase_id,
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
