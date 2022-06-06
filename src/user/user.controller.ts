import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import MongooseClassSerializerInterceptor from 'src/authentication/mongooseClassSerializer.interceptor';
import { User } from './schema/user.schema';
import { UserService } from './user.service';

// @UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('search?')
  @UseInterceptors(MongooseClassSerializerInterceptor(User))
  async getUsersFromSearch(@Query('email') searchQuery: string) {
    console.log('searchQuery', searchQuery);
    if (searchQuery) {
      const user = await this.userService.searchUserName(searchQuery);
      return user;
    }
  }

  @Get(':id')
  @UseInterceptors(MongooseClassSerializerInterceptor(User))
  async getUser(@Param('id') user_id: string) {
    const user = await this.userService.getOneUser(user_id);
    return user;
  }
}
