import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import TokenPayload from './tokenPayload.interface';
import { Response } from 'express';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async getToken(user_id: string) {
    const payload: TokenPayload = { user_id };
    const token = this.jwtService.sign(payload);
    return token;
  }
  public setAuthCookies(res: Response, idToken): Response {
    res.cookie('Authorization', idToken, {
      signed: true,
      maxAge: 1000 * this.configService.get<number>('JWT_EXPIRATION_TIME'),
      httpOnly: true,
    });
    return res;
  }
}
