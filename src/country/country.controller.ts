import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CountryService } from './country.service';
import { CreateCountryDto } from './dto/creat.dto';
import { UpdateCountryDto } from './dto/update.dto';
import { Country } from './entities/country.entities';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('country')
@UseGuards(JwtAuthGuard)
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  findAll(): Promise<Country[]> {
    return this.countryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Country> {
    return this.countryService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCountryDto): Promise<Country> {
    return this.countryService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCountryDto,
  ): Promise<Country> {
    return this.countryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void | Country> {
    return this.countryService.remove(id);
  }
}
