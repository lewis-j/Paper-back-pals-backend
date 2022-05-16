import { Module } from '@nestjs/common';
import { UserBooksService } from './user-books.service';
import { UserBooksController } from './user-books.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserBooks,
  UserBooksSchema,
  UserBooksDocument,
} from './schema/userbooks.schema';
import { BooksModule } from 'src/books/books.module';

@Module({
  imports: [
    BooksModule,
    MongooseModule.forFeatureAsync([
      {
        name: UserBooks.name,
        useFactory: () => {
          const schema = UserBooksSchema;
          schema.pre<UserBooksDocument>('save', function () {
            this.updatedAt = new Date();
          });
          return schema;
        },
      },
    ]),
  ],
  controllers: [UserBooksController],
  providers: [UserBooksService],
})
export class UserBooksModule {}
