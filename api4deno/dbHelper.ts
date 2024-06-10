import { Client } from "./deps.ts";

const dbHost = Deno.env.get("DB_HOST");
const dbPort = Deno.env.get("DB_PORT") || 3306;
const dbName = Deno.env.get("DB_NAME") || "love_word";
const dbUsername = Deno.env.get("DB_USERNAME") || "example";
const dbPassword = Deno.env.get("DB_PASSWORD") || "example";

const client = await new Client().connect({
  hostname: dbHost,
  port: Number(dbPort),
  db: dbName,
  username: dbUsername,
  password: dbPassword,
});

export async function excuteSql<T>(sql: string, args: string[]) {
  const { rows } = await client.execute(sql, args);
  return rows as T[];
}

export { client as dbClient };
