import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async register(email: string, pass: string, name: string) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(pass, saltRounds);

    // Create a new user object
    const newUser = this.usersRepository.create({
      email: email,
      name: name,
      password_hash: Buffer.from(hash), // Convert string hash to Buffer for BYTEA
      is_approved: false,
    });

    // Save the new user to the database
    return await this.usersRepository.save(newUser);
  }

  async login(email: string, pass: string) {
    const user = await this.usersRepository.findOne({ where: { email } }); // Find user by email

    // Compare provided password with stored hash
    if (user && await bcrypt.compare(pass, user.password_hash.toString())) {
      return user; // Authentication successful
    }
    return null; // Authentication failed
  }
}