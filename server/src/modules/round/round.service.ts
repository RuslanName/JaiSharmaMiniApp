import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from './round.entity';
import * as puppeteer from 'puppeteer';
import { Cron, CronExpression } from '@nestjs/schedule';
import { config } from '../../config/constants';

@Injectable()
export class RoundService {
  private isRunning = false;

  constructor(
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async extractRounds() {
    if (this.isRunning) {
      console.log('Previous task still running, skipping');
      return;
    }

    this.isRunning = true;
    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
      });
      page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );

      await page.goto(config.PARSING_WEBSITE_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const demoButtonSelector = 'button.demo-btn.accent-button.fill-button';
      await page.waitForSelector(demoButtonSelector, { timeout: 10000 });
      await page.click(demoButtonSelector);

      await page.waitForSelector(
        'iframe[src*="demo.spribe.io/launch/aviator"]',
        {
          timeout: 30000,
        },
      );

      const iframeElement = await page.$(
        'iframe[src*="demo.spribe.io/launch/aviator"]',
      );
      if (!iframeElement) {
        throw new Error('iframe not found');
      }
      const frame = await iframeElement.contentFrame();
      if (!frame) {
        throw new Error('iframe content not accessible');
      }

      const payoutsSelector = 'div.payouts-wrapper';
      await frame.waitForSelector(payoutsSelector, { timeout: 15000 });

      const newRounds = await frame.evaluate(
        async (payoutsSelector: string, maxCoefficients: number) => {
          const payouts = document.querySelectorAll(
            `${payoutsSelector} .payout`,
          );
          const rounds: { round: string; multiplier: number }[] = [];

          for (let i = 0; i < Math.min(payouts.length, maxCoefficients); i++) {
            const payout = payouts[i] as HTMLElement;
            payout.click();

            await new Promise((resolve) => setTimeout(resolve, 500));
            const modal = document.querySelector('div.modal-dialog.modal-lg');
            if (!modal) continue;

            const roundElement = modal.querySelector('span.text-uppercase');
            const round = roundElement
              ? roundElement.textContent?.trim() || 'Round not found'
              : 'Round not found';

            const multiplierElement = modal.querySelector(
              'div.bubble-multiplier',
            );
            const multiplierText = multiplierElement
              ? multiplierElement.textContent?.trim() || '1.0'
              : '1.0';
            let multiplier = parseFloat(multiplierText) || 1.0;
            const decimalPlaces = (multiplierText.split('.')[1] || '').length;
            if (decimalPlaces > 2) {
              multiplier = Number(multiplier.toFixed(2));
            }

            rounds.push({ round, multiplier });

            const closeButton = modal.querySelector(
              'button.close',
            ) as HTMLElement | null;
            if (closeButton) closeButton.click();

            await new Promise((resolve) => setTimeout(resolve, 300));
          }

          return rounds;
        },
        payoutsSelector,
        config.MAX_ROUNDS_PER_RUN,
      );

      for (const roundData of newRounds) {
        const existingRound = await this.roundRepository.findOne({
          where: { round_id: roundData.round },
        });
        if (!existingRound) {
          const round = this.roundRepository.create({
            round_id: roundData.round,
            multiplier: roundData.multiplier,
          });
          await this.roundRepository.save(round);
        }
      }

      const count = await this.roundRepository.count();
      if (count > 100) {
        const oldestRounds = await this.roundRepository.find({
          order: { created_at: 'ASC' },
          take: count - 100,
        });
        await this.roundRepository.remove(oldestRounds);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error extracting rounds: ${errorMessage}`);
      throw new Error(`Error extracting rounds: ${errorMessage}`);
    } finally {
      if (browser) {
        const pages = await browser.pages();
        for (const p of pages) {
          await p.close();
        }
        await browser.close();
      }
      this.isRunning = false;
    }
  }

  async getRecentRounds(limit: number): Promise<Round[]> {
    return await this.roundRepository.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
