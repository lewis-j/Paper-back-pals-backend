import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/firesbase/firebase-auth-guard';
import { CreateUserDto } from './dto/CreateUserDto';
import { UsersService } from './users.service';

@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() createUser: CreateUserDto) {
    return this.usersService.createNewUser(createUser);
  }
}
