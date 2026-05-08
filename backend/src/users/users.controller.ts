import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

type UserRole = 'user' | 'agent' | 'admin';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Request() req) {
    return this.usersService.findAll(req.session.user);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: UserRole },
    @Request() req,
  ) {
    return this.usersService.updateRole(id, body.role, req.session.user);
  }

  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usersService.deleteUser(id, req.session.user);
  }
}
