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
  Delete,
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
  @Get('request/returned-books')
  async getRet(@Request() req: RequestWithUID) {
    const { user_id } = req.user;
    return await this.userBooksService.getReturnedBooks(user_id);
  }

  @Get('request/:id')
  async getOneRequest(@Param('id') request_id: string) {
    return await this.userBooksService.getBookRequest(request_id);
  }
  @Delete('request/:id')
  async deleteOneRequest(
    @Param('id') request_id: string,
    @Request() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
    console.log('delete request', request_id, user_id);
    return await this.userBooksService.deleteBookRequest(request_id, user_id);
  }
  @Post('request')
  async createBookRequest(@Request() req: RequestWithUID, @Body() body: any) {
    const { user_id } = req.user;
    const { userBook_id } = body;
    const { bookRequest, notification } =
      await this.userBooksService.createBookRequest(user_id, userBook_id);
    return { bookRequest, notification };
  }
  @Put('request/:id/status/next')
  async nextBookRequestStatus(
    @Param('id') request_id,
    @Request() req: RequestWithUID,
    @Body() body,
  ) {
    console.log('nextBookRequestStatus');
    console.log('request_id', request_id);
    const { user_id } = req.user;
    const { status } = body;
    console.log('user_id', user_id);
    console.log('status', status);
    return await this.userBooksService.nextRequestStatus(
      request_id,
      user_id,
      status,
    );
  }
  @Put('request/:id/status/return')
  async requestReturn(
    @Param('id') request_id,
    @Request() req: RequestWithUID,
    @Body() body,
  ) {
    const { user_id } = req.user;
    const { status } = body;
    console.log('request return');
    console.log('request_id', request_id);
    console.log('user_id', user_id);
    console.log('status', status);
    return await this.userBooksService.requestReturn(
      request_id,
      user_id,
      status,
    );
  }

  @Put('request/:id/status/return/cancel')
  async cancelReturnRequest(
    @Param('id') request_id,
    @Request() req: RequestWithUID,
    @Body() body,
  ) {
    const { user_id } = req.user;
    const { status } = body;
    console.log('request return');
    console.log('request_id', request_id);
    console.log('user_id', user_id);
    console.log('status', status);
    return await this.userBooksService.cancelReturnRequest(
      request_id,
      user_id,
      status,
    );
  }
  @Put('request/:id/updatePageCount')
  async updatePageCount(@Param('id') request_id, @Body() body: any) {
    const { currentPage } = body;
    console.log('request_id in user books', request_id);
    const result = await this.userBooksService.updatePageCount(
      request_id,
      currentPage,
    );
    console.log('result in user books', result);
  }
  @Put('request/:id/decline')
  async declineBookRequest(
    @Param('id') request_id: string,
    @Request() req: RequestWithUID,
  ) {
    console.log('declineBookRequest');
    const { user_id } = req.user;
    console.log('user_id', user_id);
    return await this.userBooksService.declineBookRequest(request_id, user_id);
  }
  @Put('request/:id/cancel')
  async cancelBookRequest(
    @Param('id') request_id: string,
    @Request() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
    return await this.userBooksService.cancelBookRequest(request_id, user_id);
  }
  @Delete(':id')
  async deleteUserBook(
    @Param('id') userbook_id: string,
    @Request() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
    return await this.userBooksService.deleteUserBook(user_id, userbook_id);
  }
}
