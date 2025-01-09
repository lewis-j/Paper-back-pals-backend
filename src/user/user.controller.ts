import {
  Controller,
  Get,
  Param,
  Put,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  Body,
  UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import MongooseClassSerializerInterceptor from 'src/authentication/mongooseClassSerializer.interceptor';
import RequestWithUID from 'src/authentication/requestWithUID.interface';
import { User } from './schema/user.schema';
import { UserService } from './user.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/authentication/requestWithUser.interface';
import { UpdateUserProfileDto } from './dto/UpdateUserDto';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('search?')
  @UseInterceptors(MongooseClassSerializerInterceptor(User))
  async getUsersFromSearch(@Query('user') searchQuery: string) {
    if (searchQuery) {
      const user = await this.userService.searchUserName(searchQuery);
      return user;
    }
  }
  @Put('update')
  @UseInterceptors(MongooseClassSerializerInterceptor(User))
  async updateUser(
    @Request() req: RequestWithUID,
    @Body() body: UpdateUserProfileDto,
  ) {
    const { user_id } = req.user;
    console.log(user_id, body);
    return await this.userService.updateUser(user_id, body);
  }

  @Get(':id')
  @UseInterceptors(MongooseClassSerializerInterceptor(User))
  async getUser(@Param('id') user_id: string) {
    const user = await this.userService.getOneUser(user_id);

    return user;
  }

  @Put('setCurrentRead/:id')
  async setCurrentRead(
    @Param('id') userBook_id: string,
    @Request() req: RequestWithUID,
  ) {
    const { user_id } = req.user;
    return await this.userService.setCurrentRead(user_id, userBook_id);
  }

  @Put('profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async updateProfileImage(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user.user_id;
    const imageUrl = await this.userService.setProfileImg(userId, file);
    return imageUrl;
  }

  @Put('bio')
  @UseInterceptors(MongooseClassSerializerInterceptor(User))
  async updateBio(@Request() req: RequestWithUID, @Body('bio') newBio: string) {
    const { user_id } = req.user;
    return await this.userService.updateBio(user_id, newBio);
  }
}
