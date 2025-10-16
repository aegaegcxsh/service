import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entities';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async run() {
    const username = 'test';
    const password = '123qwe';

    const exists = await this.userRepo.findOne({ where: { username } });
    if (exists) {
      console.log('✅ User already exists:', username);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, password: hashed });
    await this.userRepo.save(user);

    console.log('✅ User created successfully:', username);
  }
}
