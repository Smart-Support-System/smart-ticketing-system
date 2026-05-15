import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface AuthRequest {
  user?: any;
  session: {
    user?: any;
    destroy: (callback?: (err?: Error) => void) => void;
  };
}

@Controller('auth')
export class AuthController {
  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Request() req: AuthRequest): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req.session.user = req.user; // Save user session
    return { message: 'Login successful' };
  }
  @Post('logout')
  logout(@Request() req: AuthRequest): any {
    req.session.destroy();
    return { message: 'Logout successful' };
  }
}
