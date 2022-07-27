import { Module } from '@nestjs/common';
import { UserBooksService } from './user-books.service';
import { UserBooksController } from './user-books.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserBooks, UserBooksSchema } from './schema/userbooks.schema';
import { BooksModule } from 'src/books/books.module';
import { BookRequestModule } from 'src/book-request/book-request.module';

@Module({
  imports: [
    BooksModule,
    BookRequestModule,
    MongooseModule.forFeature([
      {
        name: UserBooks.name,
        schema: UserBooksSchema,
      },
    ]),
  ],
  controllers: [UserBooksController],
  providers: [UserBooksService],
})
export class UserBooksModule {}
