import {
  Controller,
  Get,
  Post,
  Request,
  Response,
  UseGuards,
} from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { FirebaseAuthGuard } from "src/firesbase/firebase-auth-guard";

@UseGuards(FirebaseAuthGuard)
@Controller("authentication")
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Get()
  getCsrfToken(@Request() req) {
    const token = req.csrfToken();
    return { csrfToken: token };
  }

  @Post()
  setAuthenticatedUser(@Request() req, @Response() res) {
    const idToken = req.user?.accessToken;
    res.cookie("Authorization", idToken, {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
    return res.send();
  }
}
