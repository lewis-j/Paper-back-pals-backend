import {
  Body,
  Controller,
  Get,
  Request,
  Post,
  UseGuards,
  Put,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/authentication/firebase-auth-guard';
import { CreateUserDto } from './dto/CreateUserDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { UsersService } from './users.service';

@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getToken(@Request() req) {
    const token = req.csrfToken();
    return token;
  }

  @Post()
  createUser(@Request() firebaseUser, @Body() createUser: CreateUserDto) {
    const { user_id, email, email_verified } = firebaseUser.user;
    const firebaseData = { user_id, email, email_verified };

    return this.usersService.createNewUser(firebaseData, createUser);
  }
  @Get()
  getUser(@Request() firebaseUser) {
    return this.usersService.getUserByFirebaseId(firebaseUser.user.user_id);
  }

  @Post('google')
  getGoogleUser(@Request() firebaseUser) {
    // console.log("token in google route", firebaseUser.csrfToken());
    // console.log("request in google route", firebaseUser.cookies);
    const {
      name: username,
      picture: profilePic,
      email,
      email_verified,
      user_id: firebase_id,
    } = firebaseUser.user;
    return this.usersService.getUserFromGoogle({
      firebase_id,
      username,
      profilePic,
      email,
      email_verified,
    });
  }

  @Put()
  updateUser(@Request() firebaseUser, @Body() updateUser: UpdateUserDto) {
    const { user_id, email, email_verified } = firebaseUser.user;
    const firebaseData = { user_id, email, email_verified };

    return this.usersService.updateUser(firebaseData, updateUser);
  }
}
