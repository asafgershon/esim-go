import { cleanEnv, str, url } from 'envalid';

export const env = cleanEnv(process.env, {
  EASYCARD_API_KEY: str(),
  EASYCARD_API_URL: url({ default: 'https://ecng-transactions.azurewebsites.net' }),
});