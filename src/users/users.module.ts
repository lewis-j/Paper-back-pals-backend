import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Users, UsersSchema, UsersDocument } from "./schema/user.schema";

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Users.name,
        useFactory: function () {
          const schema = UsersSchema;
          schema.pre<UsersDocument>("save", function () {
            this.updatedAt = new Date();
          });
          return schema;
        },
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
