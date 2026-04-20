import session from 'express-session';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: 'THIS SHOULD BE REPLACED WITH AN ENVIRONMENT KEY EVENTUALLY',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // should be true in production
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
