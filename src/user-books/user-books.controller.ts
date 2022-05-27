import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { createBookDto } from 'src/books/dto/createBookDto';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import { UserBooksService } from './user-books.service';

@UseGuards(JwtAuthGuard)
@Controller('user-books')
export class UserBooksController {
  constructor(private readonly userBooksService: UserBooksService) {}

  @Post(':id')
  createUserBook(@Param('id') id, @Body() userBook: createBookDto) {
    return this.userBooksService.createUserBook(id, userBook);
  }

  @Get(':id')
  getOwnersBooks(@Param('id') id) {
    console.log('getting books');
    return this.userBooksService.getUserBooks(id);
  }
}
