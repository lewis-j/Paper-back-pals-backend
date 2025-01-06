import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Rating, RatingSchema } from './schema/rating.schema';
import { Books, BooksSchema } from 'src/books/schema/book.schema';

@Module({
  controllers: [RatingController],
  providers: [RatingService],
  imports: [
    MongooseModule.forFeature([
      { name: Rating.name, schema: RatingSchema },
      { name: Books.name, schema: BooksSchema },
    ]),
  ],
})
export class RatingModule {}
