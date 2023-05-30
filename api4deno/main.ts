import "https://deno.land/std@0.188.0/dotenv/load.ts";

import { serve, connect } from "./deps.ts";
import { ApiCode, apiMessageMap, Dict, type ApiRes } from "./util.ts";

const port = Deno.env.get("SERVER_PORT") || "8000";

const dbHost = Deno.env.get("DB_HOST");
const dbUsername = Deno.env.get("DB_USERNAME") || "example";
const dbPassword = Deno.env.get("DB_PASSWORD") || "example";

const client = connect({
  host: dbHost,
  username: dbUsername,
  password: dbPassword,
});

const handler = async (req: Request) => {
  const { searchParams, pathname } = new URL(req.url);
  const q = searchParams.get("q");
  const ret = {} as ApiRes;
  if (pathname === "/dict" && q) {
    const sql = `SELECT * FROM stardict WHERE word = ?`;
    const { rows } = await client.execute(sql, [q]);
    const [data] = <Dict[]>rows;

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
