import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { FriendRequest } from 'src/friends/schema/friendRequest.schema';
import { CreateFireUserDto } from './dto/CreateFireUserDto';
import { FireBaseUserDto } from './dto/FireBaseUserDto';
import { GoogleUserDto } from './dto/GoogleUserDto';
import { UpdateUserProfileDto } from './dto/UpdateUserDto';
import { User } from './schema/user.schema';
import { AuthUserDoc } from './schema/UserModel.interface';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: AuthUserDoc,
    private cloudinaryService: CloudinaryService,
  ) {}

  async upsertFireUser(firebaseUser: GoogleUserDto) {
    const { firebase_id: id, email } = firebaseUser;
    try {
      const existingUser = await this.userModel.getFireUser(id);

      if (existingUser) {
        // Check if emails don't match
        if (existingUser.email !== email) {
          // Update the email in MongoDB to match Firebase
          existingUser.email = email;
          await existingUser.save();
        }
        return { user: existingUser, statusCode: 200 };
      }

      const newUser = await this.userModel.create(firebaseUser);
      return { user: newUser, statusCode: 201 };
    } catch (err) {
      throw new UnauthorizedException('Failed to create or update user');
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
  async updateUser(user_id: string, updatedUser: UpdateUserProfileDto) {
    try {
      const updated = await this.userModel.findByIdAndUpdate(
        user_id,
        { $set: updatedUser },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updated) {
        throw new NotFoundException('User not found');
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to update user');
    }
  }

  public async setProfileImg(user_id: string, imgFile: Express.Multer.File) {
    try {
      const imageUrl = await this.cloudinaryService.uploadImage(imgFile);
      const updatedUser = await this.userModel.findByIdAndUpdate(
        user_id,
        {
          profilePic: imageUrl,
        },
        {
          new: true,
        },
      );
      return imageUrl;
    } catch (error) {
      return error;
    }
  }

  public async setCurrentRead(user_id, userBook_id) {
    const userBookAsObjectId = new Types.ObjectId(userBook_id);
    try {
      return await this.userModel.findByIdAndUpdate(
        user_id,
        {
          currentRead: userBookAsObjectId,
        },
        {
          new: true,
        },
      );
    } catch (error) {
      return error;
    }
  }

  async getOneUser(_id: string) {
    const user = await this.userModel.getUser(_id);

    if (!user) throw new NotFoundException('User does not exist');
    return user;
  }

  async searchUserName(searchTerm: string) {
    const user = await this.userModel.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ],
    });
    return user;
  }

  async addFriendFromRequest(
    request: FriendRequest,
    session: ClientSession | null = null,
  ) {
    const { sender, recipient } = request;

    const _recipient = await this.userModel
      .findById(recipient)
      .session(session);
    const _sender = await this.userModel.findById(sender).session(session);
    if (!(_recipient && _sender))
      throw new NotFoundException('user does not exist!');
    _recipient.friends.push(sender);
    _sender.friends.push(recipient);
    await _recipient.save();
    return await _sender.save();
  }

  public removeFriendFromBothUsers = async (
    user_id: string,
    friend_id: string,
    session: ClientSession,
  ) => {
    await this.userModel.updateOne(
      { _id: user_id },
      { $pull: { friends: friend_id } },
      { session },
    );

    await this.userModel.updateOne(
      { _id: friend_id },
      { $pull: { friends: user_id } },
      { session },
    );
  };

  async updateBio(userId: string, newBio: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { bio: newBio },
      { new: true },
    );
  }
}
