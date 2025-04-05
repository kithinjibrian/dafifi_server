import {
    Controller,
    Get,
    Request,
    Post,
    UseGuards,
    Response,
    UnauthorizedException
} from '@nestjs/common';
import { AppService } from './app.service';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private authService: AuthService
    ) { }

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @UseGuards(LocalAuthGuard)
    @Post('auth/login')
    async login(@Request() req, @Response() res) {
        const { access_token, refresh_token } = await this.authService.login(req.user);

        res.cookie('access_token', access_token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            //secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ user: req.user });
    }

    @Post('auth/refresh')
    async getProfile(@Request() req, @Response() res) {
        const refresh_token = req.cookies['refresh_token'];

        if (!refresh_token) {
            throw new UnauthorizedException('No refresh token found');
        }

        try {
            const { access_token, refresh_token: new_refresh_token } = await this.authService.refresh(refresh_token);

            res.cookie('access_token', access_token, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === 'production',
                //sameSite: 'strict',
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refresh_token', new_refresh_token, {
                httpOnly: true,
                //secure: process.env.NODE_ENV === 'production',
                //sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({ message: 'Tokens refreshed successfully' });

        } catch (e) {
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            throw e;
        }
    }

    @Post('auth/logout')
    async logout(@Response() res) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');

        res.json({ message: 'Logged out successfully' });
    }

}
