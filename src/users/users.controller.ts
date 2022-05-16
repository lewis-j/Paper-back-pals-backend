import {
  Body,
  Controller,
  Get,
  Request,
  Post,
  UseGuards,
  Put,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/firesbase/firebase-auth-guard';
import { CreateUserDto } from './dto/CreateUserDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { UsersService } from './users.service';

@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Request() firebaseUser, @Body() createUser: CreateUserDto) {
    console.log('request from createUser', firebaseUser.user);
    const { user_id, email, email_verified } = firebaseUser.user;
    const firebaseData = { user_id, email, email_verified };

    return this.usersService.createNewUser(firebaseData, createUser);
  }
  @Get()
  getUser(@Request() firebaseUser) {
    return this.usersService.getOneUser(firebaseUser.user.user_id);
  }
  @Put()
  updateUser(@Request() firebaseUser, @Body() updateUser: UpdateUserDto) {
    const { user_id, email, email_verified } = firebaseUser.user;
    const firebaseData = { user_id, email, email_verified };

    return this.usersService.updateUser(firebaseData, updateUser);
  }
}
