import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Request,
  Response,
  UseGuards,
} from "@nestjs/common";
import { Response as ResponseType, Request as RequestType } from "express";
import { AuthenticationService } from "./authentication.service";
import { FirebaseAuthGuard } from "src/authentication/firebase-auth-guard";
import { UsersService } from "src/users/users.service";
import { JwtAuthGuard } from "./jwt-auth-guard";
import RequestWithUser from "./requestWithUser.interface";

@Controller("authentication")
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly usersService: UsersService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async fetchUser(@Request() req) {
    const { user_id } = req.user;
    console.log("user in fetch::", req.user);
    return await this.usersService.getUserById(user_id);
  }

  @Get("token")
  getCsrfToken(@Request() req) {
    const token = req.csrfToken();
    return { csrfToken: token };
  }

  @UseGuards(FirebaseAuthGuard)
  @Post("login")
  async setAuthenticatedUser(
    @Request() req: RequestWithUser,
    @Response() res: ResponseType
  ) {
    const { firebase_id } = req.user;
    const user = await this.usersService.getUserByFirebaseId(firebase_id);
    const idToken = await this.authenticationService.getToken(user._id);
    const resWithCookies = this.authenticationService.setAuthCookies(
      res,
      idToken
    );

    return resWithCookies.send(user);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post("google")
  async verifiedGoogleSignIn(
    @Request() req: RequestWithUser,
    @Response() res: ResponseType
  ) {
    const { user: firebaseUser } = req;
    const user = await this.usersService.getUserFromGoogle(firebaseUser);
    const idToken = await this.authenticationService.getToken(user._id);
    const resWithCookies = this.authenticationService.setAuthCookies(
      res,
      idToken
    );

    return resWithCookies.send(user);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post("register")
  async registerNewUser(
    @Request() req: RequestWithUser,
    @Response() res: ResponseType
  ) {
    const { user: firebaseUser } = req;
    console.log("firebase User:", firebaseUser);
    const user = await this.usersService.createUserFromFireUser(firebaseUser);
    const idToken = await this.authenticationService.getToken(user._id);
    const resWithCookies = this.authenticationService.setAuthCookies(
      res,
      idToken
    );
    return resWithCookies.send({ user });
  }

  @Delete("logout")
  removeAuthenticatedUser(@Response() res: ResponseType) {
    res.clearCookie("Authorization");
    return res.send();
  }
}
