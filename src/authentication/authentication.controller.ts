import {
  Controller,
  Delete,
  Get,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { Response as ResponseType, Request as RequestType } from 'express';
import { AuthenticationService } from './authentication.service';
// import { FirebaseAuthGuardCookies } from 'src/firebase/firebase-auth-guard-cookies';
import { FirebaseAuthGuard } from 'src/authentication/firebase-auth-guard';
import { UsersService } from 'src/users/users.service';
import TokenPayload from './tokenPayload.interface';
import { JwtAuthGuard } from './jwt-auth-guard';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly usersService: UsersService,
  ) {}

  // @UseGuards(FirebaseAuthGuard)
  @Get()
  getCsrfToken(@Request() req) {
    const token = req.csrfToken();
    return { csrfToken: token };
  }

  @UseGuards(FirebaseAuthGuard)
  @Post()
  async setAuthenticatedUser(@Request() req, @Response() res: ResponseType) {
    const firebase_id = req.user?.user_id;
    const user = await this.usersService.getUserByFirebaseId(firebase_id);
    const idToken = await this.authenticationService.getToken(user._id);
    console.log('id token:', idToken);
    res.cookie('Authorization', idToken, {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
    console.log('response from auth route', req.user);
    return res.send({ user });
  }
  @UseGuards(JwtAuthGuard)
  @Post('test')
  async testingGuards(@Request() req) {
    console.log('request in test route', req.user);
    return req.signedCookies.Authorization;
  }

  // @UseGuards(FirebaseAuthGuardCookies)
  @Delete()
  removeAuthenticatedUser(@Response() res: ResponseType) {
    res.clearCookie('Authorization');
    return res.send();
  }
}
