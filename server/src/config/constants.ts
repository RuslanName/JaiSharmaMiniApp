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
  WEB_APP_URL: process.env.WEB_APP_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  PARSING_WEBSITE_URL: process.env.PARSING_WEBSITE_URL || '',
  MAX_ROUNDS_PER_RUN: Number(process.env.MAX_ROUNDS_PER_RUN),
  PORT: process.env.PORT || '5000',
  MODE: process.env.MODE,
};
