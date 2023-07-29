import "https://deno.land/std@0.194.0/dotenv/load.ts";

import { serve, log } from "./deps.ts";
import { logInit } from "./logHelper.ts";
import {
  ApiCode,
  apiMessageMap,
  Dict,
  type ApiRes,
  type User,
  type WordRecord,
} from "./model.ts";
import { loginHandler } from "./user.ts";
import { recordHandler } from "./record.ts";
import { dictHandler } from "./dict.ts";

const port = Deno.env.get("SERVER_PORT") || "8000";
const secret = new TextEncoder().encode(Deno.env.get("SECRET"));

await logInit();

const handler = async (req: Request) => {
  log.info(req.url);
  const ret = {} as ApiRes<Dict | User | WordRecord | string | unknown>;
  const { pathname } = new URL(req.url);
  try {
    if (pathname === "/dict") {
      const data = await dictHandler(req);
      if (data) {
        ret.code = ApiCode.SUCCESS;
        ret.data = data;
      } else {
        ret.code = ApiCode.NO_QUERY_RESULT;
      }
    } else if (pathname === "/login") {
      const data = await loginHandler(req, secret);
      if (data) {
        ret.code = ApiCode.SUCCESS;
        ret.data = data;
      } else {
        ret.code = ApiCode.NO_QUERY_RESULT;
      }
    } else if (pathname === "/records") {
      const data = await recordHandler(req, secret);
      ret.code = ApiCode.SUCCESS;
      if (typeof data === "string") {
        ret.msg = data;
      } else {
        ret.data = data;
      }
    } else {
      ret.code = ApiCode.URL_INCORRECT;
    }
  } catch (error) {
    ret.code = ApiCode.SERVICE_ERROR;
    log.error(error.message);
  }
  ret.msg = ret.msg || apiMessageMap.get(ret.code) || "Oops,err!";
  return Response.json(ret);
};

await serve(handler, { port: parseInt(port) });
