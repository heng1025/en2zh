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
import { route } from "./route.ts";
import { EmptyError } from "./error.ts";

const port = Deno.env.get("SERVER_PORT") || "8000";

await logInit();

const handler = async (req: Request) => {
  log.info(`[${req.method}]: ${req.url}`);
  const ret = {} as ApiRes<Dict | User | WordRecord | string | unknown>;
  const { pathname } = new URL(req.url);

  if (route.has(pathname)) {
    try {
      ret.code = ApiCode.SUCCESS;
      ret.data = await route.get(pathname)(req);
    } catch (error) {
      if (error instanceof EmptyError) {
        ret.code = ApiCode.NO_QUERY_RESULT;
      } else {
        ret.code = ApiCode.SERVICE_ERROR;
      }
      ret.msg = error.message;
      log.error(error.message);
    }
  } else {
    ret.code = ApiCode.URL_INCORRECT;
  }

  ret.msg = ret.msg || apiMessageMap.get(ret.code) || "Oops,err!";
  return Response.json(ret);
};

await serve(handler, { port: parseInt(port) });
