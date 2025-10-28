import * as dotenv from 'dotenv';

dotenv.config();

export const getAllowedOrigins = (): string[] => {
  return process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((h) => h.trim())
    : [];
};
