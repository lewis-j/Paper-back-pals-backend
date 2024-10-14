import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, ExtractJwt } from 'passport-firebase-jwt';
import * as firebase from 'firebase-admin';
import { Request } from 'express';
//https://stackoverflow.com/questions/32950966/typescript-compiler-error-when-importing-json-file

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(
  Strategy,
  'firebase-auth',
) {
  private defaultApp: any;
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
    });
    this.defaultApp = firebase;
  }
  async validate(req: Request, token: string) {
    const firebaseUser: any = await this.defaultApp
      .auth()
      .verifyIdToken(token, true)
      .catch((err) => {
        console.log(err);
        throw new UnauthorizedException(err.message);
      });
    if (!firebaseUser) {
      throw new UnauthorizedException();
    }

    const { user_id, name, email, email_verified, picture } = firebaseUser;
    return {
      firebase_id: user_id,
      username: name,
      email,
      email_verified,
      profilePic: picture,
    };
  }
}
