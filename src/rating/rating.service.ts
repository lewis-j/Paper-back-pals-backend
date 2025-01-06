import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { Rating, RatingDocument } from './schema/rating.schema';
import { Books } from 'src/books/schema/book.schema';

@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
    @InjectModel(Books.name) private booksModel: Model<Books>,
    @InjectConnection() private connection: Connection,
  ) {}

  private async withTransaction(session, closure) {
    let result;
    await session.withTransaction(async () => {
      result = await closure(session);
      return result;
    });
    return result;
  }

  async create(userId: string, createRatingDto: CreateRatingDto) {
    // Check if user has already rated this book
    const existingRating = await this.ratingModel.findOne({
      user: userId,
      book: createRatingDto.bookId,
    });

    if (existingRating) {
      throw new UnauthorizedException('You have already rated this book');
    }

    const session = await this.connection.startSession();

    try {
      const result = await this.withTransaction(session, async (_session) => {
        // Get current book data
        const book = await this.booksModel.findById(createRatingDto.bookId);
        if (!book) {
          throw new NotFoundException('Book not found');
        }

        // Create the rating
        const rating = await this.ratingModel.create(
          [
            {
              user: userId,
              book: createRatingDto.bookId,
              rating: createRatingDto.rating,
              review: createRatingDto.review,
            },
          ],
          { session: _session },
        );

        // Calculate new average rating
        const newAverageRating =
          (book.averageRating * book.numberOfRatings + createRatingDto.rating) /
          (book.numberOfRatings + 1);

        await this.booksModel.findByIdAndUpdate(
          createRatingDto.bookId,
          {
            averageRating: Number(newAverageRating.toFixed(1)),
            numberOfRatings: book.numberOfRatings + 1,
          },
          { session: _session },
        );

        return rating[0].populate('book', 'title coverImg authors');
      });

      return result;
    } finally {
      session.endSession();
    }
  }

  async findUserRatings(userId: string) {
    return this.ratingModel
      .find({ user: userId })
      .populate('book', 'title coverImg authors')
      .sort({ createdAt: -1 });
  }

  async findBookRatings(bookId: string) {
    return this.ratingModel
      .find({ book: bookId })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const rating = await this.ratingModel
      .findById(id)
      .populate('book', 'title coverImg authors')
      .populate('user', 'username profilePic');

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return rating;
  }

  async update(id: string, userId: string, updateRatingDto: UpdateRatingDto) {
    const rating = await this.ratingModel.findById(id);

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.user.toString() !== userId) {
      throw new UnauthorizedException('You can only update your own ratings');
    }

    const session = await this.connection.startSession();

    try {
      const result = await this.withTransaction(session, async (_session) => {
        const book = await this.booksModel.findById(rating.book);
        if (!book) {
          throw new NotFoundException('Book not found');
        }

        // Calculate new average rating by removing old rating and adding new rating
        const newAverageRating =
          (book.averageRating * book.numberOfRatings -
            rating.rating +
            updateRatingDto.rating) /
          book.numberOfRatings;

        const updatedRating = await this.ratingModel
          .findByIdAndUpdate(id, updateRatingDto, {
            new: true,
            session: _session,
          })
          .populate('book', 'title coverImg authors');

        await this.booksModel.findByIdAndUpdate(
          rating.book,
          {
            averageRating: Number(newAverageRating.toFixed(1)),
          },
          { session: _session },
        );

        return updatedRating;
      });

      return result;
    } finally {
      session.endSession();
    }
  }

  async remove(id: string, userId: string) {
    const rating = await this.ratingModel.findById(id);

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.user.toString() !== userId) {
      throw new UnauthorizedException('You can only delete your own ratings');
    }

    const session = await this.connection.startSession();

    try {
      const result = await this.withTransaction(session, async (_session) => {
        const book = await this.booksModel.findById(rating.book);
        if (!book) {
          throw new NotFoundException('Book not found');
        }

        await rating.deleteOne({ session: _session });

        // Calculate new average rating by removing the deleted rating
        const newAverageRating =
          book.numberOfRatings > 1
            ? (book.averageRating * book.numberOfRatings - rating.rating) /
              (book.numberOfRatings - 1)
            : 0;

        await this.booksModel.findByIdAndUpdate(
          rating.book,
          {
            averageRating: Number(newAverageRating.toFixed(1)),
            numberOfRatings: book.numberOfRatings - 1,
          },
          { session: _session },
        );

        return { message: 'Rating deleted successfully' };
      });

      return result;
    } finally {
      session.endSession();
    }
  }
}
