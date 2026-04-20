import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async validateUser(username: string, password: string): Promise<any> {
    // Replace with database validation
    if (username === 'test' && password === 'password') {
      return { id: 1, username: 'test' };
    }
    return null;
  }
}