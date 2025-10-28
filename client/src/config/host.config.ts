import * as dotenv from 'dotenv';

dotenv.config();

export const getAllowedHosts = (): string[] => {
  return process.env.ALLOWED_HOSTS
      ? process.env.ALLOWED_HOSTS.split(',').map(h => h.trim())
      : [];
};