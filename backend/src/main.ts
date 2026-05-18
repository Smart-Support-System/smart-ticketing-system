import session from 'express-session';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
//import { LocalStrategy } from './auth/local.strategy'; // might delete this line later (used for testing)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(
    session({
      secret: config.get<string>(
        'SESSION_SECRET',
        'REPLACETHISWITHSOMETHINGSECURE',
      ),
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // should be true in production
    }),
  );

  const frontend_host = config.get<string>('FRONTEND_HOST', 'localhost');
  const frontend_port = config.get<number>('FRONTEND_PORT', 5173);
  const backend_port = config.get<number>('BACKEND_PORT', 3000);
  app.enableCors({
    origin: `${frontend_host}:${frontend_port}`,
    credentials: true,
  });

  await app.listen(backend_port);
}
bootstrap();
