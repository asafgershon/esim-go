import { getEasyCardClient, env as easycardEnv } from "@hiilo/easycard";
import { getClient } from "./client";

async function run() {
  const client = await getEasyCardClient();

  // List webhooks executions
  const webhooks = await client.webhooks.apiWebhooksGet(
    {terminalID: easycardEnv.EASYCARD_TERMINAL_ID},
    {
      headers: {
        ...client.headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  console.log(webhooks);
}
run();
