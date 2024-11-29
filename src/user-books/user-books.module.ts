import { Module } from '@nestjs/common';
import { UserBooksService } from './user-books.service';
import { UserBooksController } from './user-books.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserBooks, UserBooksSchema } from './schema/userbooks.schema';
import { BooksModule } from 'src/books/books.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { BookRequest, BookRequestSchema } from './schema/bookRequest.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { UserBooksScheduler } from './user-books.scheduler';

@Module({
  imports: [
    BooksModule,
    NotificationsModule,
    MongooseModule.forFeature([
      {
        name: UserBooks.name,
        schema: UserBooksSchema,
      },
      {
        name: BookRequest.name,
        schema: BookRequestSchema,
      },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [UserBooksController],
  providers: [UserBooksService, UserBooksScheduler],
})
export class UserBooksModule {}
