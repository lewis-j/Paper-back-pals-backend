import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import * as cookieParser from "cookie-parser";
import * as csurf from "csurf";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "http://localhost:3000", credentials: true });
  const configService = app.get(ConfigService);
  const cookieSecret = configService.get<string>("COOKIE_SECRET");
  app.use(cookieParser(cookieSecret));
  app.use(csurf({ cookie: { key: "_csrf", sameSite: true } }));

  await app.listen(3001);
}
bootstrap();
