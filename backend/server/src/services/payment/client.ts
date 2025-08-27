import { EasyCardClient } from "@hiilo/easycard";

let client: EasyCardClient;

export function getClient(): EasyCardClient {
  if (!client) {
    client = new EasyCardClient({
      apiKey: process.env.EASYCARD_API_KEY,
    });
  }
  return client;
}