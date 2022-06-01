import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { createBookDto } from 'src/books/dto/createBookDto';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import { UserBooksService } from './user-books.service';
import RequestWithUID from 'src/authentication/requestWithUID.interface';
import MongooseClassSerializerInterceptor from 'src/authentication/mongooseClassSerializer.interceptor';
import { UserBooks } from './schema/userbooks.schema';

@UseGuards(JwtAuthGuard)
@Controller('user-books')
export class UserBooksController {
  constructor(private readonly userBooksService: UserBooksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createUserBook(
    @Request() req: RequestWithUID,
    @Body() userBook: createBookDto,
  ) {
    const { user_id } = req.user;
    return this.userBooksService.createUserBook(user_id, userBook);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(MongooseClassSerializerInterceptor(UserBooks))
  @Get('owned')
  getOwnedBooks(@Request() req: RequestWithUID) {
    const { user_id } = req.user;
    return this.userBooksService.getOWnedBooks(user_id);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(MongooseClassSerializerInterceptor(UserBooks))
  @Get('borrowed')
  getBorrowedBooks(@Request() req: RequestWithUID) {
    const { user_id } = req.user;
    return this.userBooksService.getBorrowedBooks(user_id);
  }
}
