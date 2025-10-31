import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from './round.entity';
import * as puppeteer from 'puppeteer';
import { Cron, CronExpression } from '@nestjs/schedule';
import { config } from '../../config/constants';

@Injectable()
export class RoundService {
  private readonly logger = new Logger(RoundService.name);
  private isRunning = false;

  constructor(
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async extractRounds() {
    if (this.isRunning) {
      this.logger.warn('Previous task still running, skipping');
      return;
    }

    this.isRunning = true;
    let browser: puppeteer.Browser | null = null;

    try {
      this.logger.log('Starting round extraction...');

      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-features=site-isolation-trials',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
        ],
      });

      const page = await browser.newPage();
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
      if (!iframeElement) throw new Error('iframe not found');

      const frame = await iframeElement.contentFrame();
      if (!frame) throw new Error('iframe content not accessible');

      const payoutsSelector = 'div.payouts-wrapper';
      await frame.waitForSelector(payoutsSelector, { timeout: 15000 });

      const newRounds = await frame.evaluate(
        async (selector: string, max: number) => {
          const payouts = document.querySelectorAll(`${selector} .payout`);
          const rounds: { round: string; multiplier: number }[] = [];

          for (let i = 0; i < Math.min(payouts.length, max); i++) {
            const payout = payouts[i] as HTMLElement;
            payout.click();
            await new Promise((r) => setTimeout(r, 500));

            const modal = document.querySelector('div.modal-dialog.modal-lg');
            if (!modal) continue;

            const round =
              modal.querySelector('span.text-uppercase')?.textContent?.trim() ||
              'unknown';
            const multText =
              modal
                .querySelector('div.bubble-multiplier')
                ?.textContent?.trim() || '1.00';
            let multiplier = parseFloat(multText) || 1.0;
            if (multiplier > 1000) multiplier = Number(multiplier.toFixed(2));

            rounds.push({ round, multiplier });

            const close = modal.querySelector('button.close');
            if (close) {
              close.dispatchEvent(new Event('click', { bubbles: true }));
            }
            await new Promise((r) => setTimeout(r, 300));
          }
          return rounds;
        },
        payoutsSelector,
        config.MAX_ROUNDS_PER_RUN,
      );

      let saved = 0;
      for (const r of newRounds) {
        const exists = await this.roundRepository.findOne({
          where: { round_id: r.round },
        });
        if (!exists) {
          await this.roundRepository.save(
            this.roundRepository.create({
              round_id: r.round,
              multiplier: r.multiplier,
            }),
          );
          saved++;
        }
      }

      const total = await this.roundRepository.count();
      if (total > 100) {
        const toDelete = await this.roundRepository.find({
          order: { created_at: 'ASC' },
          take: total - 100,
        });
        await this.roundRepository.remove(toDelete);
      }

      this.logger.log(
        `Extracted ${newRounds.length} rounds, saved ${saved} new`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to extract rounds',
        error instanceof Error ? error.stack : error,
      );
    } finally {
      if (browser) {
        try {
          const pages = await browser.pages();
          await Promise.all(pages.map((p) => p.close().catch(() => {})));
          await browser.close();
        } catch (e) {
          this.logger.warn('Error closing browser', e);
        }
      }
      this.isRunning = false;
    }
  }

  async getRecentRounds(limit: number = 10): Promise<Round[]> {
    return this.roundRepository.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
