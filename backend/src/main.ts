import session from 'express-session';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//import { LocalStrategy } from './auth/local.strategy'; // might delete this line later (used for testing)

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

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:58509'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
