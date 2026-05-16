import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEntity } from '../tickets/ticket.entity';
import { User } from './users.entity';

type UserRole = 'user' | 'agent' | 'admin';

type CurrentUser = {
  user_id: number;
  role: UserRole;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(TicketEntity)
    private readonly ticketsRepository: Repository<TicketEntity>,
  ) {}

  private checkAdmin(currentUser: CurrentUser) {
    if (currentUser.role !== 'admin') {
      throw new NotFoundException('Users not found');
    }
  }

  private toSafeUser(user: User) {
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async findAll(currentUser: CurrentUser) {
    this.checkAdmin(currentUser);

    const users = await this.usersRepository.find({
      order: { user_id: 'ASC' },
    });

    return users.map((user) => this.toSafeUser(user));
  }

  async updateRole(id: number, role: UserRole, currentUser: CurrentUser) {
    this.checkAdmin(currentUser);

    if (role !== 'user' && role !== 'agent' && role !== 'admin') {
      throw new BadRequestException('Invalid role');
    }

    const user = await this.usersRepository.findOne({
      where: { user_id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.role = role;
    const updatedUser = await this.usersRepository.save(user);

    return this.toSafeUser(updatedUser);
  }

  async deleteUser(id: number, currentUser: CurrentUser) {
    this.checkAdmin(currentUser);

    if (id === currentUser.user_id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.usersRepository.findOne({
      where: { user_id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.ticketsRepository.delete({ userId: id });
    await this.usersRepository.delete({ user_id: id });

    return { message: `User with ID ${id} deleted successfully` };
  }
}
