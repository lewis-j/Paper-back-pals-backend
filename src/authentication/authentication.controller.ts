import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Request,
  Response,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response as ResponseType } from 'express';
import { AuthenticationService } from './authentication.service';
import { User } from 'src/user/schema/user.schema';
import { FirebaseAuthGuard } from 'src/authentication/firebase-auth-guard';
import { UserService } from 'src/user/user.service';
import { JwtAuthGuard } from './jwt-auth-guard';
import RequestWithUser from './requestWithUser.interface';
import MongooseClassSerializerInterceptor from './mongooseClassSerializer.interceptor';
import RequestWithUID from './requestWithUID.interface';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(MongooseClassSerializerInterceptor(User))
  @Get()
  async fetchUser(@Request() req: RequestWithUID) {
    const { user_id } = req.user;
    const user = await this.userService.getAuthUserById(user_id);
    return user;
  }

  @Get('token')
  getCsrfToken(@Request() req) {
    const token = req.csrfToken();
    return { csrfToken: token };
  }

  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(MongooseClassSerializerInterceptor(User))
  @HttpCode(200)
  @Post('login')
  async setAuthenticatedUser(
    @Request() req: RequestWithUser,
    @Response({ passthrough: true }) res: ResponseType,
  ) {
    const { firebase_id } = req.user;
    const user = await this.userService.getUserByFirebaseId(firebase_id);
    const idToken = await this.authenticationService.getToken(user._id);
    this.authenticationService.setAuthCookies(res, idToken);
    return user;
  }

  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(MongooseClassSerializerInterceptor(User))
  @Post('google')
  async verifiedGoogleSignIn(
    @Request() req: RequestWithUser,
    @Response({ passthrough: true }) res: ResponseType,
  ) {
    const { user: firebaseUser } = req;
    const { user, statusCode } = await this.userService.upsertFireUser(
      firebaseUser,
    );
    res.statusCode = statusCode;
    const idToken = await this.authenticationService.getToken(user._id);
    this.authenticationService.setAuthCookies(res, idToken);
    return user;
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('register')
  async registerNewUser(
    @Request() req: RequestWithUser,
    @Response({ passthrough: true }) res: ResponseType,
  ) {
    const { user: firebaseUser } = req;
    const user = await this.userService.createUserFromFireUser(firebaseUser);
    const idToken = await this.authenticationService.getToken(user._id);
    this.authenticationService.setAuthCookies(res, idToken);
    return user;
  }

  @Delete('logout')
  removeAuthenticatedUser(@Response() res: ResponseType) {
    res.clearCookie('Authorization');
    return res.send();
  }
}
