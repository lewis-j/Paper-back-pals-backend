import {
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
import { FirebaseAuthGuard } from "src/firesbase/firebase-auth-guard";
import { FirebaseAuthGuardCookies } from "src/firesbase/firebase-auth-guard-cookies";

@Controller("authentication")
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get()
  getCsrfToken(@Request() req) {
    const token = req.csrfToken();
    return { csrfToken: token };
  }

  @UseGuards(FirebaseAuthGuard)
  @Post()
  setAuthenticatedUser(
    @Request() req,
    @Response() res: ResponseType
  ): ResponseType {
    const idToken = req.user?.accessToken;
    res.cookie("Authorization", idToken, {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
    return res.send();
  }
  @UseGuards(FirebaseAuthGuardCookies)
  @Delete()
  removeAuthenticatedUser(@Response() res: ResponseType) {
    res.clearCookie("Authorization");
    return res.send();
  }
}
