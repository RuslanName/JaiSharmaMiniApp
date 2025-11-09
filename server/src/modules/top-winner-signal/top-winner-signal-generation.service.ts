import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopWinnerSignal } from './top-winner-signal.entity';
import { SettingService } from '../setting/setting.service';
import { CountryCurrency } from '../../enums';
import * as fs from 'fs';
import * as path from 'path';

interface CountryDistribution {
  INDIA: number;
  BANGLADESH: number;
  PAKISTAN: number;
  SRI_LANKA: number;
}

interface UserData {
  username: string;
  level: string;
}

@Injectable()
export class TopWinnerSignalGenerationService {
  private readonly dataPath = path.join(process.cwd(), 'data');

  constructor(
    @InjectRepository(TopWinnerSignal)
    private topWinnerSignalRepository: Repository<TopWinnerSignal>,
    private settingService: SettingService,
  ) {}

  private async getDistribution(): Promise<CountryDistribution> {
    const setting = await this.settingService.findByKey(
      'top_winners_distribution',
    );
    if (!setting || !setting.value) {
      throw new Error('top_winners_distribution setting not found');
    }
    return JSON.parse(setting.value as string) as CountryDistribution;
  }

  private selectCountry(distribution: CountryDistribution): string {
    const random = Math.random() * 100;
    let cumulative = 0;

    if (random < (cumulative += distribution.INDIA)) {
      return 'INDIA';
    }
    if (random < (cumulative += distribution.BANGLADESH)) {
      return 'BANGLADESH';
    }
    if (random < cumulative + distribution.PAKISTAN) {
      return 'PAKISTAN';
    }
    return 'SRI_LANKA';
  }

  private getCurrencyFromCountry(country: string): CountryCurrency {
    switch (country) {
      case 'INDIA':
        return CountryCurrency.INDIA;
      case 'BANGLADESH':
        return CountryCurrency.BANGLADESH;
      case 'PAKISTAN':
        return CountryCurrency.PAKISTAN;
      case 'SRI_LANKA':
        return CountryCurrency.SRI_LANKA;
      default:
        return CountryCurrency.INDIA;
    }
  }

  private getUserFileName(country: string): string {
    const countryMap: { [key: string]: string } = {
      INDIA: 'india-users.json',
      BANGLADESH: 'bangladesh-users.json',
      PAKISTAN: 'pakistan-users.json',
      SRI_LANKA: 'sri-lanka-users.json',
    };
    return countryMap[country] || 'india-users.json';
  }

  private getAmountFileName(country: string): string {
    if (country === 'INDIA' || country === 'BANGLADESH') {
      return 'india-bangladesh-amounts.json';
    }
    return 'pakistan-sri-lanka-amounts.json';
  }

  private loadJsonFile<T>(relativePath: string): T {
    const filePath = path.join(this.dataPath, relativePath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as T;
  }

  private getRandomUser(country: string): UserData {
    const fileName = this.getUserFileName(country);
    const usersPath = path.join('users', fileName);
    const users = this.loadJsonFile<UserData[]>(usersPath);
    const randomIndex = Math.floor(Math.random() * users.length);
    return users[randomIndex];
  }

  private getRandomAmount(country: string): number {
    const fileName = this.getAmountFileName(country);
    const amountsPath = path.join('amounts', fileName);
    const amounts = this.loadJsonFile<number[]>(amountsPath);
    const randomIndex = Math.floor(Math.random() * amounts.length);
    return amounts[randomIndex];
  }

  async generateTopWinnerSignal(multiplier: number): Promise<TopWinnerSignal> {
    const distribution = await this.getDistribution();
    const country = this.selectCountry(distribution);
    const currency = this.getCurrencyFromCountry(country);
    const user = this.getRandomUser(country);
    const amount = this.getRandomAmount(country);

    const topWinnerSignal = this.topWinnerSignalRepository.create({
      username: user.username,
      level: user.level,
      multiplier,
      amount,
      currency,
    });

    return await this.topWinnerSignalRepository.save(topWinnerSignal);
  }
}
