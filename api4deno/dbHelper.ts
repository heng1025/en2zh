import { connect } from "./deps.ts";

const dbHost = Deno.env.get("DB_HOST");
const dbUsername = Deno.env.get("DB_USERNAME") || "example";
const dbPassword = Deno.env.get("DB_PASSWORD") || "example";

const client = connect({
  host: dbHost,
  username: dbUsername,
  password: dbPassword,
});

export async function excuteSql<T>(sql: string, args: string[]) {
  const { rows } = await client.execute(sql, args);
  return rows as T[];
}

export { client as dbClient };
