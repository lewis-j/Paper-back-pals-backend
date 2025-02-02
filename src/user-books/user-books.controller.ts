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
  UploadedFile,
} from '@nestjs/common';
import { createBookDto } from 'src/books/dto/createBookDto';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import { UserBooksService } from './user-books.service';
import RequestWithUID from 'src/authentication/requestWithUID.interface';
import MongooseClassSerializerInterceptor from 'src/authentication/mongooseClassSerializer.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @Get('request/all')
  async getAllRequests(@Request() req: RequestWithUID) {
    const { user_id } = req.user;
    return await this.userBooksService.getAllBookRequests(user_id);
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
  @UseInterceptors(FileInterceptor('image'))
  async nextBookRequestStatus(
    @Param('id') request_id,
    @Request() req: RequestWithUID,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { status: string },
  ) {
    const { user_id } = req.user;
    const { status } = body;

    return await this.userBooksService.nextRequestStatus(
      request_id,
      user_id,
      status,
      file,
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
    return await this.userBooksService.cancelReturnRequest(
      request_id,
      user_id,
      status,
    );
  }
  @Put('request/:id/updatePageCount')
  async updatePageCount(@Param('id') request_id, @Body() body: any) {
    const { currentPage } = body;
    const result = await this.userBooksService.updatePageCount(
      request_id,
      currentPage,
    );
    return result;
  }
  @Put('request/:id/updatePictureRequired')
  async updatePictureRequired(
    @Param('id') request_id: string,
    @Body() body: any,
  ) {
    const { pictureRequired } = body;
    return await this.userBooksService.updatePictureRequired(
      request_id,
      pictureRequired,
    );
  }
  @Put('request/:id/decline')
  async declineBookRequest(
    @Param('id') request_id: string,
    @Request() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
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
  @Put('request/:id/status/image')
  async addImageToStatus(
    @Param('id') request_id: string,
    @Body() body: { imageUrl: string; status: string },
  ) {
    const { imageUrl, status } = body;
    return await this.userBooksService.addImageToStatus(
      request_id,
      status,
      imageUrl,
    );
  }
}
