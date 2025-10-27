import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  DB_URL: process.env.DB_URL,
  DB_USERNAME: process.env.DB_USERNAME || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DATABASE: process.env.DB_DATABASE || '',
  BOT_TOKEN: process.env.BOT_TOKEN,
  JWT_SECRET: process.env.JWT_SECRET,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  MINI_APP_URL: process.env.MINI_APP_URL,
  ADMIN_PANEL_URL: process.env.ADMIN_PANEL_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  SIGNAL_SEND_INTERVAL: process.env.SIGNAL_SEND_INTERVAL,
  MAX_SIGNAL_REQUESTS: process.env.SIGNAL_SEND_INTERVAL,
  START_CREDENTIALS_ISSUANCE_HOUR: process.env.SIGNAL_SEND_INTERVAL,
  END_CREDENTIALS_ISSUANCE_HOUR: process.env.SIGNAL_SEND_INTERVAL,
  MANAGER_TG_LINK: process.env.MANAGER_TG_LINK,
  PORT: process.env.PORT || '5000',
  MODE: process.env.MODE,
  PARSING_WEBSITE_URL: 'https://melbet.org.in/aviator/',
  MAX_ROUNDS_PER_RUN: 3,
};
