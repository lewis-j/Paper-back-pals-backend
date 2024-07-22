import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseAuthStrategy } from './authentication/firebase.-auth.strategy';
import { UserModule } from './user/user.module';
import { BooksModule } from './books/books.module';
import { UserBooksModule } from './user-books/user-books.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { FriendsModule } from './friends/friends.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    BooksModule,
    UserBooksModule,
    AuthenticationModule,
    FriendsModule,
    NotificationsModule,
    CloudinaryModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseAuthStrategy],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply((req, res, next) => {
        // console.log('Request csrf token', req.header('xsrf-token'));
        next();
      })
      .forRoutes('*');
  }
}
