import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Request() req): any {
    req.session.user = req.user; // Save user session
    return { message: 'Login successful' };
  }
  @Post('logout')
  logout(@Request() req): any {
    req.session.destroy();
    return { message: 'Logout successful' };
  }
}
