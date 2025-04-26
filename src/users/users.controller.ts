import { Body, Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import * as bcrypt from 'bcrypt';

@Controller('user')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('create')
    async create(@Body() createUserDto: CreateUserDto) {
        const { password, ...rest } = createUserDto;
        const hashedPassword = await bcrypt.hash(password, 10);

        const userToSave = {
            ...rest,
            password: hashedPassword,
        };

        return this.usersService.create(userToSave);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }
}
