import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '../../../config/config.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { HashUtil } from '../../../common/utils/hash.util';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.body?.refreshToken || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.jwtRefreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid token or session expired');
    }

    // Verify token against hash in database
    const isMatched = await HashUtil.comparePassword(refreshToken, user.refreshTokenHash);
    if (!isMatched) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { passwordHash, refreshTokenHash, ...result } = user;
    return result;
  }
}
