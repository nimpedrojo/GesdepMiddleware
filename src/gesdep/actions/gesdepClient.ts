import { BrowserContext, Page } from 'playwright';
import { createBrowser } from '../browser/browserFactory.js';
import { selectors } from '../selectors/index.js';
import { ExternalServiceError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';
import { config } from '../../shared/config.js';

export interface LoginCredentials {
  username: string;
  password: string;
}

export class GesdepClient {
  private browserContext?: BrowserContext;

  async init() {
    if (!this.browserContext) {
      const browser = await createBrowser();
      this.browserContext = await browser.newContext();
      logger.info('Browser context initialized for Gesdep');
    }
  }

  async login(credentials: LoginCredentials): Promise<Page> {
    await this.init();
    const page = await this.browserContext!.newPage();
    try {
      await page.goto(new URL(selectors.login.path, config.GESDEP_BASE_URL).toString(), {
        waitUntil: 'domcontentloaded'
      });
      await page.fill(selectors.login.username, credentials.username);
      await page.fill(selectors.login.password, credentials.password);
      await page.click(selectors.login.submit);
      await page.waitForSelector(selectors.login.success, {
        state: 'attached'
      });
      return page;
    } catch (err) {
      await page.close();
      logger.error({ err }, 'Gesdep login failed');
      throw new ExternalServiceError('Failed to login to Gesdep');
    }
  }

  async fetchHtml(url: string): Promise<string> {
    await this.init();
    const page = await this.browserContext!.newPage();
    try {
      await page.goto(url);
      return page.content();
    } catch (err) {
      logger.error({ err, url }, 'Fetching page failed');
      throw new ExternalServiceError('Failed to fetch Gesdep page');
    }
  }

  async openTeamsPage(): Promise<Page> {
    const page = await this.login({
      username: config.GESDEP_USERNAME,
      password: config.GESDEP_PASSWORD
    });

    try {
      await page.goto(new URL(selectors.teams.path, config.GESDEP_BASE_URL).toString(), {
        waitUntil: 'domcontentloaded'
      });
      await page.waitForSelector(selectors.teams.ready, {
        state: 'attached'
      });
      return page;
    } catch (err) {
      await page.close();
      logger.error({ err }, 'Opening teams page failed');
      throw new ExternalServiceError('Failed to open Gesdep teams page');
    }
  }

  async fetchTeamsHtml(): Promise<string> {
    const page = await this.openTeamsPage();

    try {
      return await page.content();
    } catch (err) {
      logger.error({ err }, 'Reading teams page HTML failed');
      throw new ExternalServiceError('Failed to read Gesdep teams HTML');
    } finally {
      await page.close();
    }
  }
}
