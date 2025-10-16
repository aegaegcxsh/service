import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entities';
import { CreateCountryDto } from './dto/creat.dto';
import { UpdateCountryDto } from './dto/update.dto';

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  async findAll(): Promise<Country[]> {
    return this.countryRepository.find();
  }

  async findOne(id: number): Promise<Country> {
    const country = await this.countryRepository.findOne({ where: { id } });
    if (!country) throw new NotFoundException('Страна не найдена');
    return country;
  }

  async create(dto: CreateCountryDto): Promise<Country> {
    const country = this.countryRepository.create(dto);
    return this.countryRepository.save(country);
  }

  async update(id: number, dto: UpdateCountryDto): Promise<Country> {
    const country = await this.findOne(id);
    Object.assign(country, dto);
    return this.countryRepository.save(country);
  }

  async remove(id: number): Promise<void | Country> {
    const country = await this.findOne(id);
    return this.countryRepository.remove(country);
  }
}
