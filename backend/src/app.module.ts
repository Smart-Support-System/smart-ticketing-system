import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    // Initialize ConfigModule globally to access .env everywhere
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Connect to PostgreSQL asynchronously using the ConfigService
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        // The second argument to config.get is a default fallback
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'user'),
        password: config.get<string>('DB_PASSWORD', 'password'),
        database: config.get<string>('DB_NAME', 'smart_support_db'),
        autoLoadEntities: true,
        synchronize: true, // Note: Set to false in production to avoid data loss
      }),
    }),

    AuthModule,
    TicketsModule,

    // Eventually add AuthModule, UsersModule, and TicketsModule here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
