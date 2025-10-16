import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entities';

type JwtPayload =
  | { sub: number | string; username: string }
  | Record<string, unknown>;

function isJwtPayload(
  p: unknown,
): p is { sub: number | string; username: string } {
  if (typeof p !== 'object' || p === null) return false;
  const obj = p as Record<string, unknown>;
  return 'sub' in obj && 'username' in obj && typeof obj.username === 'string';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change_this_secret',
    });
  }

  async validate(payload: JwtPayload) {
    if (!isJwtPayload(payload)) return null;

    const rawSub = payload.sub;
    const id = typeof rawSub === 'string' ? Number(rawSub) : rawSub;
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) return null;

    const user = await this.usersRepository.findOne({
      where: { id: numericId },
      select: ['id', 'username'],
    });
    if (!user) return null;
    return { id: user.id, username: user.username };
  }
}
