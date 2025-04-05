import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request) => {
                    return request?.cookies?.access_token;
                }
            ]),
            ignoreExpiration: false,
            secretOrKey: "JWT_ACCESS_SECRET",
        });
    }

    async validate(payload: any) {
        return {
            id: payload.id,
            username: payload.username
        };
    }
}