import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { FirebaseAuthStrategy } from "./firesbase/firebase.-auth.strategy";
import { UsersModule } from "./users/users.module";
import { BooksModule } from "./books/books.module";
import { UserBooksModule } from "./user-books/user-books.module";
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    BooksModule,
    UserBooksModule,
    AuthenticationModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseAuthStrategy],
})
export class AppModule {}
