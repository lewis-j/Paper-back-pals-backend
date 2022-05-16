import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { createBookDto } from 'src/books/dto/createBookDto';
import { FirebaseAuthGuard } from 'src/firesbase/firebase-auth-guard';
import { UserBooksService } from './user-books.service';

@UseGuards(FirebaseAuthGuard)
@Controller('user-books')
export class UserBooksController {
  constructor(private readonly userBooksService: UserBooksService) {}

  @Post(':id')
  createUserBook(@Param('id') id, @Body() userBook: createBookDto) {
    return this.userBooksService.createUserBook(id, userBook);
  }

  @Get(':id')
  getOwnersBooks(@Param('id') id) {
    return this.userBooksService.getUserBooks(id);
  }
}
