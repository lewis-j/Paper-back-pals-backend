import {
  Controller,
  Get,
  Param,
  Put,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import MongooseClassSerializerInterceptor from 'src/authentication/mongooseClassSerializer.interceptor';
import RequestWithUID from 'src/authentication/requestWithUID.interface';
import { User } from './schema/user.schema';
import { UserService } from './user.service';

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
}
