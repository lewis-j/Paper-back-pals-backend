import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FriendRequest,
  FriendRequestSchema,
} from './schema/friendRequest.schema';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    UserModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: FriendRequest.name, schema: FriendRequestSchema },
    ]),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
