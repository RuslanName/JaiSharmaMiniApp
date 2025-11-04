import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from './round.entity';
import * as puppeteer from 'puppeteer';
import { TimeoutError } from 'puppeteer';
import { Cron, CronExpression } from '@nestjs/schedule';
import { config } from '../../config/constants';

@Injectable()
export class RoundService {
  private readonly logger = new Logger(RoundService.name);
  private isRunning = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000;
  private readonly MAX_TASK_DURATION = 180000;
  private taskStartTime: number | null = null;
  private useHeadless = false;

  constructor(
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
  ) {}

  private async safeCloseBrowser(browser: puppeteer.Browser | null) {
    if (!browser) return;

    try {
      const pages = await browser.pages().catch((error) => {
        this.logger.debug(
          `Error getting pages for cleanup: ${error instanceof Error ? error.message : String(error)}`,
        );
        return [];
      });

      for (const page of pages) {
        try {
          if (!page.isClosed()) {
            await page.close().catch((error) => {
              this.logger.debug(
                `Error closing page: ${error instanceof Error ? error.message : String(error)}`,
              );
            });
          }
        } catch (error) {
          this.logger.debug(
            `Error checking page state: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Error during pages cleanup: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const browserProcess = browser.process();
      if (browserProcess && browserProcess.pid) {
        await browser.close().catch((error) => {
          this.logger.warn(
            `Error closing browser with process: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
      } else {
        await browser.close().catch((error) => {
          this.logger.warn(
            `Error closing browser: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
      }
    } catch (error) {
      this.logger.warn(
        `Critical error during browser cleanup: ${error instanceof Error ? error.message : String(error)}`,
      );
      try {
        await browser.close().catch((closeError) => {
          this.logger.error(
            `Final fallback browser close failed: ${closeError instanceof Error ? closeError.message : String(closeError)}`,
          );
        });
      } catch (finalError) {
        this.logger.error(
          `All browser cleanup attempts failed: ${finalError instanceof Error ? finalError.message : String(finalError)}`,
        );
      }
    }
  }

  private getErrorType(error: unknown): string {
    if (error instanceof TimeoutError) return 'TIMEOUT';
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('waiting for selector') ||
        message.includes('selector')
      )
        return 'SELECTOR_NOT_FOUND';
      if (message.includes('target closed') || message.includes('session'))
        return 'BROWSER_CLOSED';
      if (message.includes('navigation') || message.includes('goto'))
        return 'NAVIGATION_ERROR';
      if (message.includes('protocol')) return 'PROTOCOL_ERROR';
      if (
        message.includes('connection') ||
        message.includes('net::') ||
        message.includes('err_')
      )
        return 'CONNECTION_ERROR';
      if (message.includes('executable') || message.includes('launch'))
        return 'LAUNCH_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }
  private async diagnoseFrameContent(
    frame: puppeteer.Frame | null,
    page: puppeteer.Page | null,
  ): Promise<void> {
    if (!frame) {
      this.logger.warn('Diagnostics: Frame is null, cannot diagnose');
      return;
    }

    try {
      const diagnostics = await frame.evaluate(() => {
        const info: {
          url: string;
          title: string;
          bodyClasses: string[];
          bodyId: string;
          divCount: number;
          foundSelectors: string[];
          alternativeSelectors: { selector: string; count: number }[];
          pageText: string;
        } = {
          url: window.location.href,
          title: document.title || 'No title',
          bodyClasses: Array.from(document.body?.classList || []),
          bodyId: document.body?.id || 'No ID',
          divCount: document.querySelectorAll('div').length,
          foundSelectors: [],
          alternativeSelectors: [],
          pageText: document.body?.innerText?.substring(0, 500) || 'No text',
        };

        const selectorsToCheck = [
          'div.payouts-wrapper',
          '.payouts-wrapper',
          'div.payout',
          '.payout',
          'div[class*="payout"]',
          'div[class*="round"]',
          '.round',
          'div.modal-dialog',
          '.modal-dialog',
          'div[class*="modal"]',
          'iframe',
          'body > *',
        ];

        for (const selector of selectorsToCheck) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              info.foundSelectors.push(selector);
              info.alternativeSelectors.push({
                selector,
                count: elements.length,
              });
            }
          } catch (e) {}
        }

        const allDivs = document.querySelectorAll('div');
        const commonClasses: { [key: string]: number } = {};
        allDivs.forEach((div) => {
          div.classList.forEach((cls) => {
            commonClasses[cls] = (commonClasses[cls] || 0) + 1;
          });
        });

        const topClasses = Object.entries(commonClasses)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([cls, count]) => `${cls}(${count})`);

        return {
          ...info,
          topClasses,
        };
      });

      this.logger.error('=== FRAME DIAGNOSTICS ===');
      this.logger.error(`URL: ${diagnostics.url}`);
      this.logger.error(`Total DIVs: ${diagnostics.divCount}`);
      this.logger.error(
        `Found Selectors: ${diagnostics.foundSelectors.join(', ') || 'None'}`,
      );
      this.logger.error(
        `Top Classes: ${diagnostics.topClasses.slice(0, 5).join(', ')}`,
      );
      this.logger.error('=== END DIAGNOSTICS ===');

      if (page) {
        try {
          await page.screenshot({
            encoding: 'base64',
            fullPage: false,
          });
        } catch (screenshotError) {
          this.logger.debug(
            `Screenshot failed: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`,
          );
        }
      }
    } catch (diagnosticError) {
      this.logger.error(
        `Diagnostics failed: ${diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError)}`,
      );
    }
  }

  private async waitForElementWithRetry(
    frame: puppeteer.Frame | puppeteer.Page,
    selector: string,
    timeout: number = 30000,
    retries: number = 3,
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await frame.waitForSelector(selector, {
          timeout,
          visible: true,
        });
        const element = await frame.$(selector);
        if (element) {
          const isVisible = await frame.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) return false;
            const style = window.getComputedStyle(el);
            return (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              style.opacity !== '0'
            );
          }, selector);
          if (isVisible) {
            return;
          }
        }
        throw new Error(`Element ${selector} not visible`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const isTimeout =
          error instanceof TimeoutError ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('waiting for selector');

        if (i < retries - 1) {
          this.logger.warn(
            `Selector "${selector}" ${isTimeout ? 'timed out' : 'not found'}, retrying... (${i + 1}/${retries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          this.logger.error(
            `Failed to find selector "${selector}" after ${retries} retries: ${errorMessage}`,
          );
          throw error;
        }
      }
    }
    throw new Error(
      `Failed to find visible element ${selector} after ${retries} retries`,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async extractRounds() {
    if (this.isRunning) {
      const runningDuration = this.taskStartTime
        ? Date.now() - this.taskStartTime
        : 0;

      if (runningDuration > this.MAX_TASK_DURATION) {
        this.logger.error(
          `Previous task running for ${runningDuration}ms (exceeded max ${this.MAX_TASK_DURATION}ms). Force resetting...`,
        );
        this.isRunning = false;
        this.taskStartTime = null;
      } else {
        this.logger.warn(
          `Previous task still running (${Math.round(runningDuration / 1000)}s), skipping`,
        );
        return;
      }
    }

    this.isRunning = true;
    this.taskStartTime = Date.now();
    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;

    try {
      this.logger.log('Starting round extraction...');

      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          if (attempt > 1) {
            this.logger.warn(`Retry attempt ${attempt}/${this.MAX_RETRIES}`);
            await new Promise((resolve) =>
              setTimeout(resolve, this.RETRY_DELAY),
            );
            if (browser) {
              await this.safeCloseBrowser(browser);
              browser = null;
            }
          }

          try {
            const headlessRaw = process.env.PUPPETEER_HEADLESS;
            const headlessEnv = headlessRaw?.toLowerCase().trim() || '';
            const useHeadless =
              headlessEnv !== 'false' &&
              headlessEnv !== '0' &&
              headlessEnv !== '';

            this.useHeadless = useHeadless;

            const headlessArgs = useHeadless
              ? [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                  '--disable-gpu',
                  '--disable-software-rasterizer',
                  '--disable-background-timer-throttling',
                  '--disable-backgrounding-occluded-windows',
                  '--disable-renderer-backgrounding',
                  '--disable-features=TranslateUI,BlinkGenPropertyTrees',
                  '--disable-ipc-flooding-protection',
                  '--disable-blink-features=AutomationControlled',
                  '--window-size=1920,1080',
                  '--lang=en-US,en',
                  '--enable-features=NetworkService,NetworkServiceInProcess',
                  '--force-color-profile=srgb',
                  '--metrics-recording-only',
                  '--mute-audio',
                ]
              : [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                  '--disable-background-timer-throttling',
                  '--disable-renderer-backgrounding',
                  '--disable-features=site-isolation-trials',
                  '--disable-blink-features=AutomationControlled',
                  '--window-size=1920,1080',
                  '--start-maximized',
                  '--disable-infobars',
                  '--lang=en-US,en',
                  '--enable-features=NetworkService,NetworkServiceInProcess',
                ];

            browser = await puppeteer.launch({
              headless: useHeadless ? ('new' as any) : false,
              executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
              args: headlessArgs,
              defaultViewport: useHeadless
                ? { width: 1920, height: 1080 }
                : null,
            });

            if (!useHeadless) {
              this.logger.warn(
                'Running in NON-HEADLESS mode (visible browser). For VPS, set PUPPETEER_HEADLESS=true',
              );
            } else {
              this.logger.log(
                'Running in HEADLESS mode with enhanced anti-detection',
              );
            }
          } catch (launchError) {
            const errorMessage =
              launchError instanceof Error
                ? launchError.message
                : String(launchError);
            if (
              errorMessage.includes('executable') ||
              errorMessage.includes('PUPPETEER')
            ) {
              throw new Error(
                `Puppeteer executable not found. Check PUPPETEER_EXECUTABLE_PATH: ${errorMessage}`,
              );
            }
            throw new Error(`Failed to launch browser: ${errorMessage}`);
          }

          page = await browser.newPage();
          await page.setViewport({ width: 1920, height: 1080 });
          await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          );

          await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => undefined,
            });

            delete (navigator as any).__proto__.webdriver;

            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters: any) =>
              parameters.name === 'notifications'
                ? Promise.resolve({
                    state: Notification.permission,
                  } as PermissionStatus)
                : originalQuery(parameters);

            Object.defineProperty(navigator, 'plugins', {
              get: () => {
                const plugins: any[] = [];
                for (let i = 0; i < 5; i++) {
                  plugins.push({
                    name: `Plugin ${i}`,
                    description: `Plugin ${i} Description`,
                    filename: `plugin${i}.dll`,
                    length: 1,
                    item: function () {
                      return null;
                    },
                    namedItem: function () {
                      return null;
                    },
                  });
                }
                return plugins as any;
              },
            });

            if (!(window as any).chrome) {
              (window as any).chrome = {};
            }

            if (!(window as any).chrome.runtime) {
              (window as any).chrome.runtime = {};
            }

            const chromeMock = {
              runtime: {
                getExtension: function () {
                  return null;
                },
                onConnect: {
                  addListener: function () {},
                  removeListener: function () {},
                },
                onMessage: {
                  addListener: function () {},
                  removeListener: function () {},
                },
                connect: function () {
                  return {
                    postMessage: function () {},
                    onMessage: { addListener: function () {} },
                  };
                },
                sendMessage: function () {},
                lastError: null,
                id: undefined,
              },
              loadTimes: function () {
                return {
                  commitLoadTime: performance.timing.navigationStart,
                  connectionInfo: 'http/1.1',
                  finishDocumentLoadTime: performance.timing.domComplete,
                  finishLoadTime: performance.timing.loadEventEnd,
                  firstPaintAfterLoadTime: 0,
                  firstPaintTime: performance.timing.domInteractive,
                  navigationType: 'Other',
                  npnNegotiatedProtocol: 'unknown',
                  requestTime: performance.timing.requestStart,
                  startLoadTime: performance.timing.navigationStart,
                  wasAlternateProtocolAvailable: false,
                  wasFetchedViaSpdy: false,
                  wasNpnNegotiated: false,
                };
              },
              csi: function () {
                return {
                  startE: performance.timing.navigationStart,
                  onloadT: performance.timing.loadEventEnd,
                  pageT:
                    performance.timing.loadEventEnd -
                    performance.timing.navigationStart,
                  tran: 15,
                };
              },
              app: {
                isInstalled: false,
                InstallState: {
                  DISABLED: 'disabled',
                  INSTALLED: 'installed',
                  NOT_INSTALLED: 'not_installed',
                },
                RunningState: {
                  CANNOT_RUN: 'cannot_run',
                  READY_TO_RUN: 'ready_to_run',
                  RUNNING: 'running',
                },
              },
            };

            Object.defineProperty(window, 'chrome', {
              value: chromeMock,
              writable: false,
              configurable: true,
            });

            Object.defineProperty(navigator, 'plugins', {
              get: () => {
                const plugins: any[] = [];
                for (let i = 0; i < 5; i++) {
                  plugins.push({
                    name: `Plugin ${i}`,
                    description: `Plugin ${i} Description`,
                    filename: `plugin${i}.dll`,
                    length: 1,
                  });
                }
                return plugins as any;
              },
            });

            Object.defineProperty(navigator, 'languages', {
              get: () => ['en-US', 'en'],
            });

            Object.defineProperty(navigator, 'platform', {
              get: () => 'Win32',
            });

            Object.defineProperty(navigator, 'hardwareConcurrency', {
              get: () => 8,
            });

            Object.defineProperty(navigator, 'deviceMemory', {
              get: () => 8,
            });

            Object.defineProperty(navigator, 'permissions', {
              get: () => ({
                query: async () => ({ state: 'granted' }),
              }),
            });

            (window as any).Notification = class {
              static permission = 'granted';
              static async requestPermission() {
                return 'granted';
              }
            };
          });

          await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
          });

          try {
            await page.goto(config.PARSING_WEBSITE_URL, {
              waitUntil: 'networkidle2',
              timeout: 60000,
            });
          } catch (navigationError) {
            const errorMessage =
              navigationError instanceof Error
                ? navigationError.message
                : String(navigationError);
            if (navigationError instanceof TimeoutError) {
              throw new Error(
                `Navigation timeout. Website may be unreachable or slow. URL: ${config.PARSING_WEBSITE_URL}`,
              );
            }
            if (
              errorMessage.includes('net::') ||
              errorMessage.includes('ERR_')
            ) {
              throw new Error(
                `Network error during navigation: ${errorMessage}`,
              );
            }
            throw new Error(`Navigation failed: ${errorMessage}`);
          }

          await new Promise((resolve) =>
            setTimeout(resolve, this.useHeadless ? 4000 : 2000),
          );

          const demoButtonSelector =
            'button.demo-btn.accent-button.fill-button';
          await this.waitForElementWithRetry(
            page,
            demoButtonSelector,
            this.useHeadless ? 30000 : 15000,
          );

          await page.evaluate((selector) => {
            const button = document.querySelector(selector) as HTMLElement;
            if (button) {
              button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, demoButtonSelector);

          await new Promise((resolve) => setTimeout(resolve, 1000));
          await page.click(demoButtonSelector);

          await new Promise((resolve) => setTimeout(resolve, 5000));

          const iframeSelector = 'iframe[src*="demo.spribe.io/launch/aviator"]';
          await this.waitForElementWithRetry(page, iframeSelector, 30000);

          const iframeElement = await page.$(iframeSelector);
          if (!iframeElement) {
            throw new Error('iframe not found');
          }

          await new Promise((resolve) =>
            setTimeout(resolve, this.useHeadless ? 5000 : 3000),
          );

          const frame = await iframeElement.contentFrame();
          if (!frame) {
            throw new Error('iframe content not accessible');
          }

          await frame.evaluate(() => {
            const script = document.createElement('script');
            script.textContent = `
              (function() {
                const chromeMock = {
                  runtime: {
                    getExtension: function() { return null; },
                    onConnect: { addListener: function() {}, removeListener: function() {} },
                    onMessage: { addListener: function() {}, removeListener: function() {} },
                    connect: function() { return { postMessage: function() {}, onMessage: { addListener: function() {} } }; },
                    sendMessage: function() {},
                    lastError: null,
                    id: undefined,
                  },
                };
                
                if (!window.chrome) {
                  Object.defineProperty(window, 'chrome', {
                    value: chromeMock,
                    writable: false,
                    configurable: true,
                  });
                } else if (!window.chrome.runtime) {
                  window.chrome.runtime = chromeMock.runtime;
                } else if (typeof window.chrome.runtime.getExtension !== 'function') {
                  window.chrome.runtime.getExtension = function() { return null; };
                }
                
                window.__CHROME_MOCK_INJECTED__ = true;
              })();
            `;
            (document.head || document.documentElement).insertBefore(
              script,
              (document.head || document.documentElement).firstChild,
            );
            script.remove();
          });

          const chromeMockScript = `
            (function() {
              if (window.chrome && window.chrome.runtime) {
                return;
              }
              
              const chromeMock = {
                runtime: {
                  getExtension: function() { 
                    console.log('getExtension called, returning null');
                    return null; 
                  },
                  onConnect: {
                    addListener: function() {},
                    removeListener: function() {},
                  },
                  onMessage: {
                    addListener: function() {},
                    removeListener: function() {},
                  },
                  connect: function() {
                    return {
                      postMessage: function() {},
                      onMessage: { addListener: function() {} },
                    };
                  },
                  sendMessage: function() {},
                  lastError: null,
                  id: undefined,
                },
                loadTimes: function() {
                  return {
                    commitLoadTime: 0,
                    connectionInfo: 'http/1.1',
                    finishDocumentLoadTime: 0,
                    finishLoadTime: 0,
                    firstPaintAfterLoadTime: 0,
                    firstPaintTime: 0,
                    navigationType: 'Other',
                    npnNegotiatedProtocol: 'unknown',
                    requestTime: 0,
                    startLoadTime: 0,
                    wasAlternateProtocolAvailable: false,
                    wasFetchedViaSpdy: false,
                    wasNpnNegotiated: false,
                  };
                },
                csi: function() {
                  return {
                    startE: 0,
                    onloadT: 0,
                    pageT: 0,
                    tran: 15,
                  };
                },
                app: {
                  isInstalled: false,
                  InstallState: {
                    DISABLED: 'disabled',
                    INSTALLED: 'installed',
                    NOT_INSTALLED: 'not_installed',
                  },
                  RunningState: {
                    CANNOT_RUN: 'cannot_run',
                    READY_TO_RUN: 'ready_to_run',
                    RUNNING: 'running',
                  },
                },
              };
              
              Object.defineProperty(window, 'chrome', {
                value: chromeMock,
                writable: false,
                configurable: true,
              });
              
              console.log('Chrome mock injected via script tag');
            })();
          `;

          try {
            await frame.addScriptTag({
              content: chromeMockScript,
            });
          } catch (scriptTagError) {}

          try {
            await frame.evaluate(() => {
              if (!(window as any).chrome) {
                (window as any).chrome = {
                  runtime: {
                    getExtension: function () {
                      return null;
                    },
                    onConnect: {
                      addListener: function () {},
                      removeListener: function () {},
                    },
                    onMessage: {
                      addListener: function () {},
                      removeListener: function () {},
                    },
                    connect: function () {
                      return {
                        postMessage: function () {},
                        onMessage: { addListener: function () {} },
                      };
                    },
                    sendMessage: function () {},
                    lastError: null,
                    id: undefined,
                  },
                };
              } else if (!(window as any).chrome.runtime) {
                (window as any).chrome.runtime = {
                  getExtension: function () {
                    return null;
                  },
                  onConnect: {
                    addListener: function () {},
                    removeListener: function () {},
                  },
                  onMessage: {
                    addListener: function () {},
                    removeListener: function () {},
                  },
                  connect: function () {
                    return {
                      postMessage: function () {},
                      onMessage: { addListener: function () {} },
                    };
                  },
                  sendMessage: function () {},
                  lastError: null,
                  id: undefined,
                };
              } else if (
                typeof (window as any).chrome.runtime.getExtension !==
                'function'
              ) {
                (window as any).chrome.runtime.getExtension = function () {
                  return null;
                };
              }
            });
          } catch (evaluateError) {}

          await frame.evaluate(() => {
            const originalError = window.onerror;
            window.onerror = function (msg, url, line, col, error) {
              if (
                msg &&
                typeof msg === 'string' &&
                msg.includes('getExtension')
              ) {
                console.log('Suppressed getExtension error');
                return true;
              }
              if (originalError) {
                return originalError.apply(this, arguments as any);
              }
              return false;
            };

            window.addEventListener(
              'error',
              (e) => {
                if (e.message && e.message.includes('getExtension')) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              },
              true,
            );

            window.addEventListener('unhandledrejection', (e) => {
              if (e.reason && String(e.reason).includes('getExtension')) {
                e.preventDefault();
                return false;
              }
            });
          });

          await new Promise((resolve) => setTimeout(resolve, 3000));

          const wasInjected = await frame.evaluate(() => {
            return (
              !!(window as any).__CHROME_MOCK_INJECTED__ ||
              ((window as any).chrome &&
                (window as any).chrome.runtime &&
                typeof (window as any).chrome.runtime.getExtension ===
                  'function')
            );
          });

          if (!wasInjected) {
            await frame.evaluate(() => {
              (window as any).chrome = {
                runtime: {
                  getExtension: function () {
                    return null;
                  },
                  onConnect: {
                    addListener: function () {},
                    removeListener: function () {},
                  },
                  onMessage: {
                    addListener: function () {},
                    removeListener: function () {},
                  },
                  connect: function () {
                    return {
                      postMessage: function () {},
                      onMessage: { addListener: function () {} },
                    };
                  },
                  sendMessage: function () {},
                  lastError: null,
                  id: undefined,
                },
              };
              Object.freeze((window as any).chrome.runtime);
            });
          }

          try {
            await frame.waitForFunction(
              () => {
                const hasPayouts =
                  document.querySelector('.payouts-block') !== null ||
                  document.querySelector('div.payouts-block') !== null ||
                  document.querySelector('.payouts-wrapper') !== null ||
                  document.querySelector('.payout') !== null ||
                  document.querySelector('[class*="payout"]') !== null;

                const hasContent =
                  document.body &&
                  (document.body.children.length > 10 ||
                    document.body.innerText.length > 100);

                return hasPayouts || hasContent;
              },
              { timeout: 45000, polling: 2000 },
            );
          } catch (waitError) {
            await new Promise((resolve) => setTimeout(resolve, 10000));

            const hasContentAfterWait = await frame.evaluate(() => {
              return (
                document.querySelector('.payouts-block') !== null ||
                document.querySelector('.payouts-wrapper') !== null ||
                document.querySelector('.payout') !== null ||
                (document.body && document.body.children.length > 10)
              );
            });

            if (!hasContentAfterWait) {
              throw new Error('Content did not load in iframe');
            }
          }

          let attempts = 0;
          const maxAttempts = 20;

          while (attempts < maxAttempts) {
            const checkResult = await frame.evaluate(() => {
              const hasPayouts =
                document.querySelector('div.payouts-wrapper') !== null ||
                document.querySelector('.payouts-wrapper') !== null ||
                document.querySelector('.payout') !== null ||
                document.querySelector('[class*="payout"]') !== null;

              const stillLoading =
                document.body?.classList.contains('main-loading') ||
                document.querySelector('.main-loading') !== null ||
                document.querySelector('.spinner') !== null;

              const errorElements = document.querySelectorAll(
                '[class*="error"], .main-error-message',
              );
              const errorText = document.body?.innerText || '';
              const hasErrorInText =
                errorText.includes('Cannot read properties') ||
                errorText.includes('getExtension') ||
                errorText.includes('undefined');

              const chrome = (window as any).chrome;
              const chromeExists =
                typeof chrome !== 'undefined' && chrome !== null;
              const chromeRuntimeExists =
                chromeExists && typeof chrome.runtime !== 'undefined';
              const getExtensionExists =
                chromeRuntimeExists &&
                typeof chrome.runtime.getExtension === 'function';

              const testGetExtension = chromeRuntimeExists
                ? (() => {
                    try {
                      const result = chrome.runtime.getExtension();
                      return { success: true, result };
                    } catch (e) {
                      return { success: false, error: String(e) };
                    }
                  })()
                : null;

              const networkActivity =
                (window as any).performance?.getEntriesByType?.('resource')
                  ?.length || 0;

              return {
                hasPayouts,
                stillLoading,
                hasErrorInText,
                hasErrorElements: errorElements.length > 0,
                bodyChildren: document.body?.children.length || 0,
                chromeExists,
                chromeRuntimeExists,
                getExtensionExists,
                testGetExtension,
                errorPreview: errorText.substring(0, 150),
                networkActivity,
                documentReadyState: document.readyState,
              };
            });

            if (!checkResult.getExtensionExists && checkResult.hasErrorInText) {
              this.logger.warn(
                'Chrome runtime not properly injected. Re-injecting...',
              );
              try {
                await frame.evaluate(() => {
                  const chromeMock = {
                    runtime: {
                      getExtension: function () {
                        return null;
                      },
                      onConnect: {
                        addListener: function () {},
                        removeListener: function () {},
                      },
                      onMessage: {
                        addListener: function () {},
                        removeListener: function () {},
                      },
                      connect: function () {
                        return {
                          postMessage: function () {},
                          onMessage: { addListener: function () {} },
                        };
                      },
                      sendMessage: function () {},
                      lastError: null,
                      id: undefined,
                    },
                  };
                  (window as any).chrome = chromeMock;
                });
              } catch (reinjectError) {
                this.logger.error(
                  `Re-injection failed: ${reinjectError instanceof Error ? reinjectError.message : String(reinjectError)}`,
                );
              }
            }

            if (checkResult.hasPayouts) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              break;
            }

            if (checkResult.hasErrorElements && attempts >= 3) {
              await frame.evaluate(() => {
                const errors = document.querySelectorAll(
                  '.main-error-message, [class*="error"]',
                );
                errors.forEach((el) => {
                  try {
                    el.remove();
                  } catch (e) {
                    (el as HTMLElement).style.display = 'none';
                  }
                });
              });
            }

            if (
              checkResult.stillLoading &&
              attempts >= 5 &&
              checkResult.documentReadyState === 'complete'
            ) {
              await frame.evaluate(() => {
                const loading = document.querySelectorAll(
                  '.main-loading, .spinner, [class*="loading"], .main-error-message',
                );
                loading.forEach((el) => {
                  try {
                    el.remove();
                  } catch (e) {
                    (el as HTMLElement).style.display = 'none';
                  }
                });

                if (document.body) {
                  document.body.classList.remove('main-loading');
                }

                window.dispatchEvent(new Event('load'));
                window.dispatchEvent(new Event('focus'));
                document.dispatchEvent(new Event('DOMContentLoaded'));

                const scripts = document.querySelectorAll('script[src]');
                scripts.forEach((script) => {
                  const newScript = document.createElement('script');
                  newScript.src = (script as HTMLScriptElement).src;
                  document.head.appendChild(newScript);
                });
              });

              await new Promise((resolve) => setTimeout(resolve, 10000));

              for (let retry = 0; retry < 3; retry++) {
                const afterForceCheck = await frame.evaluate(() => {
                  return {
                    hasPayouts:
                      document.querySelector('.payouts-block') !== null ||
                      document.querySelector('.payouts-wrapper') !== null ||
                      document.querySelector('.payout') !== null,
                  };
                });

                if (afterForceCheck.hasPayouts) {
                  attempts = maxAttempts;
                  break;
                }

                if (retry < 2) {
                  await new Promise((resolve) => setTimeout(resolve, 3000));
                }
              }
            }

            if (
              checkResult.testGetExtension &&
              !checkResult.testGetExtension.success
            ) {
              this.logger.warn(
                `getExtension call failed: ${checkResult.testGetExtension.error}`,
              );
            }

            attempts++;
            if (attempts < maxAttempts) {
              this.logger.debug(
                `Waiting... (${attempts}/${maxAttempts}) - Loading: ${checkResult.stillLoading}, ` +
                  `Body: ${checkResult.bodyChildren} elements, ReadyState: ${checkResult.documentReadyState}, ` +
                  `Network: ${checkResult.networkActivity} requests, ` +
                  `Chrome: ${checkResult.chromeExists}, Runtime: ${checkResult.chromeRuntimeExists}, ` +
                  `getExtension: ${checkResult.getExtensionExists}${checkResult.testGetExtension ? ` (test: ${checkResult.testGetExtension.success ? 'OK' : 'FAIL'})` : ''}` +
                  (checkResult.hasErrorInText ? `, Error text present` : '') +
                  (checkResult.hasErrorElements
                    ? `, Error elements: ${checkResult.hasErrorElements}`
                    : ''),
              );

              if (attempts === 5 || attempts === 10 || attempts === 15) {
                this.logger.warn(
                  `Attempt ${attempts}: Still in loading state. Site may require real Chrome extension or user interaction.`,
                );
              }

              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          }

          if (attempts >= maxAttempts) {
            await this.diagnoseFrameContent(frame, page);
            throw new Error('Payouts content did not appear after waiting');
          }

          let payoutsSelector = '.payouts-block';
          let alternativeFound = false;

          try {
            await this.waitForElementWithRetry(frame, payoutsSelector, 10000);
            alternativeFound = true;
          } catch (selectorError) {
            const alternativeSelectors = [
              'div.payouts-block',
              '.payouts-wrapper',
              'div.payouts-wrapper',
              '[class*="payout"]',
              '.payout',
            ];

            for (const altSelector of alternativeSelectors) {
              try {
                await frame.waitForSelector(altSelector, {
                  timeout: 5000,
                  visible: true,
                });
                payoutsSelector = altSelector;
                alternativeFound = true;
                break;
              } catch (e) {}
            }

            if (!alternativeFound) {
              await this.diagnoseFrameContent(frame, page);
              throw new Error(
                `No payouts container found. Check diagnostics above.`,
              );
            }
          }

          let newRounds: { round: string; multiplier: number }[] = [];

          try {
            newRounds = await frame.evaluate(
              async (containerSelector: string, max: number) => {
                let payouts: NodeListOf<Element>;

                if (
                  containerSelector === '.payout' ||
                  containerSelector.includes('[class*="payout"]')
                ) {
                  payouts = document.querySelectorAll(containerSelector);
                } else {
                  payouts = document.querySelectorAll(
                    `${containerSelector} .payout`,
                  );
                }

                if (payouts.length === 0) {
                  const directPayouts = document.querySelectorAll('.payout');
                  if (directPayouts.length > 0) {
                    payouts = directPayouts;
                  } else {
                    throw new Error('No payouts found in DOM');
                  }
                }

                const rounds: { round: string; multiplier: number }[] = [];
                const timestamp = Date.now();

                for (let i = 0; i < Math.min(payouts.length, max); i++) {
                  try {
                    const payout = payouts[i];
                    if (!payout) {
                      console.warn(`Payout element ${i} is null, skipping`);
                      continue;
                    }

                    const text = payout.textContent?.trim() || '';
                    const multMatch = text.match(/(\d+\.?\d*)\s*x/i);

                    if (!multMatch) {
                      console.warn(
                        `No multiplier found in payout ${i} text: "${text}"`,
                      );
                      continue;
                    }

                    let multiplier = parseFloat(multMatch[1]);
                    if (isNaN(multiplier) || multiplier <= 0) {
                      console.warn(
                        `Invalid multiplier "${multMatch[1]}" for payout ${i}`,
                      );
                      continue;
                    }

                    multiplier = Number(multiplier.toFixed(2));

                    let roundId: string;

                    try {
                      payout.dispatchEvent(
                        new MouseEvent('click', { bubbles: true }),
                      );
                      await new Promise((r) => setTimeout(r, 800));

                      const modal = document.querySelector(
                        'div.modal-dialog.modal-lg, div[class*="modal"], [class*="dialog"]',
                      );
                      if (modal) {
                        const roundElement = modal.querySelector(
                          'span.text-uppercase, [class*="round"], [class*="id"]',
                        );
                        const roundText = roundElement?.textContent?.trim();
                        if (
                          roundText &&
                          roundText !== 'unknown' &&
                          roundText.length > 0
                        ) {
                          roundId = roundText;
                        } else {
                          roundId = `round_${timestamp}_${i}`;
                        }

                        const close = modal.querySelector(
                          'button.close, [class*="close"], button[aria-label*="close" i]',
                        );
                        if (close) {
                          close.dispatchEvent(
                            new MouseEvent('click', { bubbles: true }),
                          );
                          await new Promise((r) => setTimeout(r, 300));
                        }
                      } else {
                        roundId = `round_${timestamp}_${i}`;
                      }
                    } catch (clickError) {
                      roundId = `round_${timestamp}_${i}`;
                    }

                    rounds.push({ round: roundId, multiplier });
                  } catch (itemError) {
                    console.error(`Error processing payout ${i}:`, itemError);
                    continue;
                  }
                }

                if (rounds.length === 0) {
                  throw new Error('No valid rounds extracted from payouts');
                }

                return rounds;
              },
              payoutsSelector,
              config.MAX_ROUNDS_PER_RUN,
            );

            if (!Array.isArray(newRounds) || newRounds.length === 0) {
              throw new Error('No rounds extracted from page');
            }
          } catch (evaluateError) {
            const errorMessage =
              evaluateError instanceof Error
                ? evaluateError.message
                : String(evaluateError);
            throw new Error(
              `Failed to evaluate rounds from page: ${errorMessage}`,
            );
          }

          let saved = 0;
          let duplicates = 0;
          let dbErrors = 0;

          for (const r of newRounds) {
            try {
              if (
                !r ||
                !r.round ||
                r.round === 'unknown' ||
                typeof r.multiplier !== 'number' ||
                r.multiplier <= 0
              ) {
                this.logger.warn(
                  `Invalid round data skipped: ${JSON.stringify(r)}`,
                );
                continue;
              }

              const exists = await this.roundRepository
                .findOne({
                  where: { round_id: r.round },
                })
                .catch((dbError) => {
                  this.logger.error(
                    `Database query error for round ${r.round}: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
                  );
                  dbErrors++;
                  return null;
                });

              if (exists) {
                duplicates++;
                continue;
              }

              try {
                await this.roundRepository.save(
                  this.roundRepository.create({
                    round_id: r.round,
                    multiplier: r.multiplier,
                  }),
                );
                saved++;
              } catch (saveError) {
                const errorMessage =
                  saveError instanceof Error
                    ? saveError.message
                    : String(saveError);
                if (
                  errorMessage.toLowerCase().includes('duplicate') ||
                  errorMessage.toLowerCase().includes('unique')
                ) {
                  duplicates++;
                } else {
                  this.logger.error(
                    `Failed to save round ${r.round}: ${errorMessage}`,
                  );
                  dbErrors++;
                }
              }
            } catch (roundError) {
              this.logger.error(
                `Error processing round ${r?.round || 'unknown'}: ${roundError instanceof Error ? roundError.message : String(roundError)}`,
              );
              dbErrors++;
            }
          }

          try {
            const total = await this.roundRepository.count();
            if (total > 100) {
              const toDelete = await this.roundRepository.find({
                order: { created_at: 'ASC' },
                take: total - 100,
              });

              if (toDelete.length > 0) {
                await this.roundRepository
                  .remove(toDelete)
                  .catch((deleteError) => {
                    this.logger.error(
                      `Failed to delete old rounds: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`,
                    );
                  });
                this.logger.debug(
                  `Deleted ${toDelete.length} old rounds (total was: ${total})`,
                );
              }
            }
          } catch (cleanupError) {
            this.logger.warn(
              `Database cleanup error: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
            );
          }

          if (dbErrors > 0) {
            this.logger.warn(
              `Database errors encountered: ${dbErrors} errors during save operations`,
            );
          }

          this.logger.log(
            `Extracted ${newRounds.length} rounds, saved ${saved} new, ${duplicates} duplicates skipped${dbErrors > 0 ? `, ${dbErrors} errors` : ''}`,
          );

          break;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorType = this.getErrorType(error);

          this.logger.warn(
            `Attempt ${attempt}/${this.MAX_RETRIES} failed [${errorType}]: ${errorMessage}`,
          );

          if (attempt === this.MAX_RETRIES) {
            this.logger.error(
              `Failed to extract rounds after all ${this.MAX_RETRIES} retries [${errorType}]`,
              error instanceof Error ? error.stack : error,
            );

            if (errorType === 'TIMEOUT' || errorType === 'SELECTOR_NOT_FOUND') {
              this.logger.warn(
                'Suggestion: Website structure may have changed or server is slow. Check selectors.',
              );
            } else if (
              errorType === 'BROWSER_CLOSED' ||
              errorType === 'PROTOCOL_ERROR'
            ) {
              this.logger.warn(
                'Suggestion: Browser may have crashed. Check system resources and Puppeteer installation.',
              );
            } else if (
              errorType === 'NAVIGATION_ERROR' ||
              errorType === 'CONNECTION_ERROR'
            ) {
              this.logger.warn(
                `Suggestion: Check website availability: ${config.PARSING_WEBSITE_URL}`,
              );
            }

            throw error;
          }

          if (browser) {
            await this.safeCloseBrowser(browser);
            browser = null;
            page = null;
          }
        }
      }
    } catch (error) {
      const errorType = this.getErrorType(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Round extraction failed completely [${errorType}]: ${errorMessage}`,
        error instanceof Error ? error.stack : error,
      );

      if (errorType === 'LAUNCH_ERROR') {
        this.logger.error(
          `Check PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'not set'}`,
        );
      }
    } finally {
      if (page && !page.isClosed()) {
        try {
          await page.close().catch((error) => {
            this.logger.debug(
              `Error closing page in finally: ${error instanceof Error ? error.message : String(error)}`,
            );
          });
        } catch (error) {
          this.logger.debug(
            `Error checking page state in finally: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      await this.safeCloseBrowser(browser);

      const taskEndTime = Date.now();
      this.isRunning = false;
      this.taskStartTime = null;
    }
  }

  async getRecentRounds(limit: number = 10): Promise<Round[]> {
    try {
      if (limit <= 0 || limit > 100) {
        this.logger.warn(
          `Invalid limit requested: ${limit}. Using default: 10`,
        );
        limit = 10;
      }

      const rounds = await this.roundRepository.find({
        order: { created_at: 'DESC' },
        take: limit,
      });

      return rounds;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve recent rounds: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : error,
      );
      return [];
    }
  }
}
