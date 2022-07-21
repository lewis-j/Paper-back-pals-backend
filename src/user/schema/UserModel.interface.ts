import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

export interface AuthUserDoc extends Model<UserDocument> {
  getAuthUser: (_id: string) => Promise<User>;
  getFireUser: (_id: string) => Promise<User>;
  getUser: (_id: string) => Promise<User>;
}
