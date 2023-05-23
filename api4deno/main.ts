import "https://deno.land/std@0.188.0/dotenv/load.ts";

import { serve, Client } from "./deps.ts";
import { ApiCode, apiMessageMap, type ApiRes } from "./util.ts";

const port = Deno.env.get("SERVER_PORT") || "8000";

const dbHost = Deno.env.get("DB_HOST");
const dbPort = Deno.env.get("DB_PORT") || "3306";
const dbName = Deno.env.get("DB_NAME") || "8000";
const dbUsername = Deno.env.get("DB_USERNAME") || "8000";
const dbPassword = Deno.env.get("DB_PASSWORD") || "8000";

const client = await new Client().connect({
  hostname: dbHost,
  port: parseInt(dbPort),
  username: dbUsername,
  password: dbPassword,
  db: dbName,
});

const handler = async (req: Request) => {
  const { searchParams, pathname } = new URL(req.url);
  const q = searchParams.get("q");
  const ret = {} as ApiRes;
  if (pathname === "/dict" && q) {
    const sql = "SELECT * FROM stardict WHERE word = ?";
    const [data] = await client.query(sql, [q]);
    if (data) {
      ret.code = ApiCode.SUCCESS;
      ret.data = data;
    } else {
      ret.code = ApiCode.NO_QUERY_RESULT;
    }
  } else {
    ret.code = ApiCode.URL_INCORRECT;
  }
  ret.msg = apiMessageMap.get(ret.code) || "Oops,err!";
  return Response.json(ret);
};

await serve(handler, { port: parseInt(port) });
