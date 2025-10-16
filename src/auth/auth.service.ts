import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entities';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

function isDbErrorWithCode(
  err: unknown,
): err is { code?: string; message?: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: { username: dto.username },
    });
    if (existing) throw new BadRequestException('Пользователь уже существует');

    const hashed: string = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      username: dto.username,
      password: hashed,
    });

    try {
      const saved = await this.usersRepository.save(user);
      return { id: saved.id, username: saved.username };
    } catch (error: unknown) {
      if (isDbErrorWithCode(error) && error.code === '23505') {
        throw new BadRequestException(
          'Пользователь с таким именем уже существует',
        );
      }
      throw new BadRequestException('Не удалось создать пользователя');
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { username: dto.username },
      select: ['id', 'username', 'password'],
    });

    if (!user) throw new UnauthorizedException('Неверные учетные данные');

    const isMatch: boolean = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Неверные учетные данные');

    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user: { id: user.id, username: user.username } };
  }
}
