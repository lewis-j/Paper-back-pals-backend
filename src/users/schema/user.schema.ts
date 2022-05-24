import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from "@nestjs/mongoose";
import { Document, Schema } from "mongoose";
import { UserBooks } from "src/user-books/schema/userbooks.schema";

export type UsersDocument = Users & Document;

@SchemaDecorator()
export class Users {
  @Prop({ required: true })
  firebase_id: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  profilePic: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: false })
  email_verified: boolean;

  @Prop({ type: [Schema.Types.ObjectId], ref: "Users", default: null })
  friends: [Users];

  @Prop({ type: Schema.Types.ObjectId, ref: "UserBooks", default: null })
  currentRead: UserBooks;

  @Prop({ immutable: true, default: () => Date.now() })
  createdAt: Date;

  @Prop({ default: () => Date.now() })
  updatedAt: Date;

  getPublicField: Function;
}

export const UsersSchema = SchemaFactory.createForClass(Users);

UsersSchema.methods.getPublicField = async function () {
  const user = await this.populate({
    model: "Users",
    path: "friends",
    select: "-firebase_id -email_verified -createdAt -updatedAt -friends",
  });

  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    profilePic: this.profilePic,
    friends: user.friends,
    currentRead: this.currentRead,
  };
};
