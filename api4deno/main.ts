import { serve } from "https://deno.land/std@0.165.0/http/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";
import { config } from "https://deno.land/std@0.166.0/dotenv/mod.ts";

const configData = await config();
const port = parseInt(configData["PORT"]);
const dbURL = configData["DB_URL"];

const dbPath = `${Deno.cwd()}/${dbURL}`;

// read db
const db = new DB(dbPath, { mode: "read" });
const query = db.prepareQuery("SELECT * FROM stardict WHERE word = ?");

const enum ApiCode {
  SUCCESS = 0,
  URL_INCORRECT = 3001,
  NO_PARAM = 3002,
  NO_QUERY_RESULT = 3003,
  SERVICE_ERROR = 3004,
}

const apiMessageMap = new Map<ApiCode, string>([
  [ApiCode.SUCCESS, "success"],
  [ApiCode.URL_INCORRECT, "url is incorrect,try /dict path"],
  [ApiCode.NO_PARAM, "no query params,try q=hello"],
  [ApiCode.NO_QUERY_RESULT, "query fail"],
  [ApiCode.SERVICE_ERROR, "service error"],
]);

type ApiRes = {
  code: number;
  msg: string;
  data?: unknown;
};

const dictRoute = (map: Map<keyof ApiRes, any>, sp: URLSearchParams) => {
  const q = sp.get("q");
  if (q) {
    const data = query.firstEntry([q]);
    if (data) {
      map.set("code", ApiCode.SUCCESS).set("data", data);
    } else {
      map.set("code", ApiCode.NO_QUERY_RESULT);
    }
  } else {
    map.set("code", ApiCode.NO_PARAM);
  }
};

const handler = (req: Request) => {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const pathname = url.pathname;

  let map = new Map<keyof ApiRes, any>();

  if (pathname === "/dict") {
    dictRoute(map, sp);
  } else {
    map.set("code", ApiCode.URL_INCORRECT);
  }

  const result = [...map].reduce((acc, [k, v]) => {
    if (k === "code") {
      acc[k] = v;
      const msg = apiMessageMap.get(v);
      if (typeof msg === "string") {
        acc.msg = msg;
      }
    } else {
      acc[k] = v;
    }

    return acc;
  }, {} as ApiRes);

  return Response.json(result);
};

await serve(handler, { port });
