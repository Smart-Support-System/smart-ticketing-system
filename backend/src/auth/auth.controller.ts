import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

interface AuthRequest {
  user?: any;
  session: {
    user?: any;
    destroy: (callback?: (err?: Error) => void) => void;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string },
  ): Promise<{ message: string }> {
    await this.authService.register(body.email, body.password, body.name);

    return { message: 'Account created successfully' };
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Request() req: AuthRequest): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req.session.user = req.user; // Save user session
    const { password_hash, ...safeUser } = req.user;
    return {
      message: 'Login successful',
      user: safeUser,
    };
  }

  @Post('logout')
  logout(@Request() req: AuthRequest): any {
    req.session.destroy();
    return { message: 'Logout successful' };
  }
}
