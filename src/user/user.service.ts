import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { FriendRequest } from 'src/friends/schema/friendRequest.schema';
import { CreateFireUserDto } from './dto/CreateFireUserDto';
import { FireBaseUserDto } from './dto/FireBaseUserDto';
import { GoogleUserDto } from './dto/GoogleUserDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { User } from './schema/user.schema';
import { AuthUserDoc } from './schema/UserModel.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: AuthUserDoc,
  ) {}

  async upsertFireUser(firebaseUser: GoogleUserDto) {
    console.log('firebase_user', firebaseUser);
    const { firebase_id: id } = firebaseUser;
    try {
      const existingUser = await this.userModel.getFireUser(id);
      if (existingUser) return { user: existingUser, statusCode: 200 };
      const newUser = await this.userModel.create(firebaseUser);
      return { user: newUser, statusCode: 201 };
    } catch (err) {
      throw new Error(err);
    }
  }

  async createUserFromFireUser(firebaseUser: FireBaseUserDto) {
    try {
      const user = new this.userModel(firebaseUser);
      return await user.save();
    } catch (error) {
      return error;
    }
  }
  async getAuthUserById(_id: string) {
    try {
      const user = await this.userModel.getAuthUser(_id);
      return user;
    } catch (err) {
      throw new NotFoundException('User does not exist');
    }
  }

  async getUserByFirebaseId(firebase_id: string) {
    try {
      const user = await this.userModel.getFireUser(firebase_id);

      if (!user) {
        throw new NotFoundException('User does not exist');
      }

      return user;
    } catch (error) {
      return error;
    }
  }
  // async updateUser(
  //   firebaseData: CreateFireUserDto,
  //   updatedUser: UpdateUserDto,
  // ) {
  //   const { firebase_id, email, email_verified } = firebaseData;
  //   try {
  //     const user = await this.userModel.findOne({
  //       firebaseId: firebase_id,
  //     });
  //     const userData = { ...updatedUser, email, email_verified };

  //     if (!user) {
  //       throw new NotFoundException('User does not exist');
  //     }
  //     [...Object.keys(updatedUser)].map((property) => {
  //       user[`${property}`] = userData[`${property}`];
  //     });
  //     const { _id } = await user.save();
  //     return { _id };
  //   } catch (error) {
  //     return error;
  //   }
  // }

  async getOneUser(_id: string) {
    try {
      const user = await this.userModel
        .findById(_id)
        .populate('friends')
        .exec();
      console.log('user', user);
      return user;
    } catch (error) {
      console.log('Error', error);
      throw new NotFoundException('User does not exist');
    }
  }

  async searchUserName(searchTerm: string) {
    try {
      const user = await this.userModel.find({
        $or: [
          { username: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
        ],
      });
      console.log('searched user', user);
      return user;
    } catch (error) {
      throw new Error(error);
    }
  }

  async addFriendFromRequest(
    request: FriendRequest,
    session: ClientSession | null = null,
  ) {
    const { sender, reciever } = request;

    const _reciever = await this.userModel.findById(reciever).session(session);
    const _sender = await this.userModel.findById(sender).session(session);
    if (!(_reciever && _sender))
      throw new NotFoundException('user does not exist!');
    _reciever.friends.push(sender);
    _sender.friends.push(reciever);
    await _reciever.save();
    await _sender.save();
  }
}
