import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { createBookDto } from 'src/books/dto/createBookDto';
import { UserBooksService } from './user-books.service';

@Controller('user-books')
export class UserBooksController {
  constructor(private readonly userBooksService: UserBooksService) {}

  @Post(':id')
  createUserBook(@Param('id') id, @Body() userBook: createBookDto) {
    return this.userBooksService.createUserBook(userBook, id);
  }

  @Get(':id')
  getOwnersBooks(@Param('id') id) {
    return this.userBooksService.getUserBooks(id);
  }
}
