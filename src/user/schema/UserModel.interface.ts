import { Model, Document } from 'mongoose';
import { User } from './user.schema';

export interface UserDocument extends Omit<User, '_id'>, Document {
  // Add any instance methods here if needed
}

export interface AuthUserDoc extends Model<UserDocument> {
  getFireUser(firebase_id: string): Promise<UserDocument>;
  getAuthUser(_id: string): Promise<UserDocument>;
  getUser(_id: string): Promise<UserDocument>;
}
