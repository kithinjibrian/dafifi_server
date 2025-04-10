import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(username);
        if (user && user.password === pass) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async generateTokens(user: any) {
        const payload = {
            id: user.id,
            username: user.username
        };

        return {
            access_token: this.jwtService.sign(payload, {
                secret: 'JWT_ACCESS_SECRET',
                expiresIn: '45m'
            }),
            refresh_token: this.jwtService.sign(payload, {
                secret: 'JWT_REFRESH_SECRET',
                expiresIn: '7d'
            })
        };
    }

    async login(user: any) {
        return this.generateTokens(user);
    }

    async validateRefreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: 'JWT_REFRESH_SECRET'
            });

            const user = await this.usersService.findOne(payload.username);

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async refresh(refresh_token: string) {
        try {
            const user = await this.validateRefreshToken(refresh_token);
            return this.generateTokens(user);
        } catch (error) {
            throw new Error(error.message);
        }
    }
}
