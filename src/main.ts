import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as admin from 'firebase-admin';
import * as csurf from 'csurf';

// import * as firebaseConfig from './authentication/firebase.config.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');
  const firebase_params = {
    type: configService.get<string>('FIREBASE_TYPE'),
    projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
    privateKeyId: configService.get<string>('FIREBASE_PRIVATE_KEY_ID'),
    privateKey: privateKey ? JSON.parse(privateKey) : undefined,
    clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
    clientId: configService.get<string>('FIREBASE_CLIENT_ID'),
    authUri: configService.get<string>('FIREBASE_AUTH_URI'),
    tokenUri: configService.get<string>('FIREBASE_TOKEN_URI'),
    authProviderX509CertUrl: configService.get<string>(
      'FIREBASE_AUTH_PROVIDER',
    ),
    clientC509CertUrl: configService.get<string>('FIREBASE_CLIENT'),
  };

  admin.initializeApp({ credential: admin.credential.cert(firebase_params) });

  app.enableCors({ origin: 'http://localhost:3000', credentials: true });

  const cookieSecret = configService.get<string>('COOKIE_SECRET');
  app.use(cookieParser(cookieSecret));
  app.use(csurf({ cookie: { key: '_csrf', sameSite: true } }));

  await app.listen(3001);
}
bootstrap();
