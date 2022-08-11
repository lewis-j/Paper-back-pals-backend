import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
  @Get('request/:id')
  async getOneRequest(@Param('id') request_id: string) {
    return await this.userBooksService.getBookRequest(request_id);
  }
  @Post('request')
  async createBookRequest(@Request() req: RequestWithUID, @Body() body: any) {
    const { user_id } = req.user;
    const { userBook_id } = body;
    const { request_id, notification } =
      await this.userBooksService.createBookRequest(user_id, userBook_id);
    return { request_id, notification };
  }
  @Put('request/:id/status/next')
  async nextBookRequestStatus(
    @Param('id') request_id,
    @Request() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
    return await this.userBooksService.nextRequestStatus(request_id, user_id);
  }
}
