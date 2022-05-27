import { Module } from '@nestjs/common';
import { UserBooksService } from './user-books.service';
import { UserBooksController } from './user-books.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserBooks, UserBooksSchema } from './schema/userbooks.schema';
import { BooksModule } from 'src/books/books.module';
import { JwtStrategy } from 'src/authentication/jwt.strategy';

@Module({
  imports: [
    BooksModule,
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
