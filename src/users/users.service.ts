import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create.dto';
import { UpdateUserDto } from './dto/update.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private isDbErrorWithCode(
    err: unknown,
  ): err is { code?: string; message?: string } {
    return typeof err === 'object' && err !== null && 'code' in err;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'createdAt', 'updatedAt'], // без паролей
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { username: dto.username },
    });
    if (existing) throw new BadRequestException('Пользователь уже существует');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      username: dto.username,
      password: hashed,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      if (
        this.isDbErrorWithCode(error) &&
        (error.code === '23505' || /unique/i.test(error.message ?? ''))
      ) {
        throw new ConflictException(
          'Пользователь с таким именем уже существует',
        );
      }
      throw new InternalServerErrorException();
    }
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    // Use preload to merge existing entity with dto
    const incoming: Partial<User> = { ...dto };
    if (incoming.password) {
      incoming.password = await bcrypt.hash(incoming.password, 10);
    }

    const preloaded = await this.usersRepository.preload({ id, ...incoming });
    if (!preloaded) throw new NotFoundException('Пользователь не найден');

    try {
      return await this.usersRepository.save(preloaded);
    } catch (error: unknown) {
      const e = error as { code?: string; message?: string };
      if (e?.code === '23505' || /unique/i.test(e?.message ?? '')) {
        throw new BadRequestException(
          'Пользователь с таким именем уже существует',
        );
      }
      throw new BadRequestException('Не удалось обновить пользователя');
    }
  }

  async remove(id: number): Promise<void> {
    const res = await this.usersRepository.delete(id);
    if (res.affected === 0)
      throw new NotFoundException('Пользователь не найден');
    return;
  }
}
