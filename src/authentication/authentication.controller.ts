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
import { CreateUserDto } from "src/users/dto/CreateUserDto";
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
    return await this.usersService.getUserById(user_id);
  }

  @Get("token")
  getCsrfToken(@Request() req) {
    const token = req.csrfToken();
    return { csrfToken: token };
  }

  @UseGuards(FirebaseAuthGuard)
  @Post("login")
  async setAuthenticatedUser(@Request() req, @Response() res: ResponseType) {
    const firebase_id = req.user?.user_id;
    const user = await this.usersService.getUserByFirebaseId(firebase_id);
    const idToken = await this.authenticationService.getToken(user._id);
    res.cookie("Authorization", idToken, {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });

    return res.send({ user });
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
    res.cookie("Authorization", idToken, {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });

    return res.send(user);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post("register")
  async registerNewUser(
    @Request() req: RequestWithUser,
    @Response() res: ResponseType,
    @Body() newUser: CreateUserDto
  ) {
    const { user: firebaseUser } = req;
    console.log("firebase User:", firebaseUser);
    const user = await this.usersService.createUserFromFireUser(firebaseUser);
    const idToken = await this.authenticationService.getToken(user._id);
    res.cookie("Authorization", idToken, {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
    console.log("response from auth route", req.user);
    return res.send({ user });
  }

  @Delete("logout")
  removeAuthenticatedUser(@Response() res: ResponseType) {
    res.clearCookie("Authorization");
    return res.send();
  }
}
