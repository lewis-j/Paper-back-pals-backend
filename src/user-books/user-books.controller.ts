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

@UseGuards(JwtAuthGuard)
@Controller('user-books')
export class UserBooksController {
  constructor(private readonly userBooksService: UserBooksService) {}

  @Post()
  createUserBook(
    @Request() req: RequestWithUID,
    @Body() userBook: createBookDto,
  ) {
    const { user_id } = req.user;
    return this.userBooksService.createUserBook(user_id, userBook);
  }
  @Post('create-request')
  async createBookRequest(@Request() req: RequestWithUID, @Body() body: any) {
    const { user_id } = req.user;
    const { userBook_id } = body;
    const userBook = await this.userBooksService.createBookRequest(
      user_id,
      userBook_id,
    );
    return userBook;
  }
}
