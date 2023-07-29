import "https://deno.land/std@0.194.0/dotenv/load.ts";

import {
  jose,
  serve,
  dateFormat,
  generate,
  crypto,
  log,
  toHashString,
  NAMESPACE_URL,
} from "./deps.ts";
import { excuteSql } from "./dbHelper.ts";
import {
  ApiCode,
  apiMessageMap,
  Dict,
  type ApiRes,
  type User,
  type WordRecord,
  type RecordType,
} from "./model.ts";

const port = Deno.env.get("SERVER_PORT") || "8000";
const secret = new TextEncoder().encode(Deno.env.get("SECRET"));

await log.setup({
  handlers: {
    stringFmt: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "[{levelName}]: {datetime} {msg}",
    }),

    functionFmt: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: (logRecord) => {
        let msg = `${logRecord.level} ${logRecord.msg}`;

        logRecord.args.forEach((arg, index) => {
          msg += `, arg${index}: ${arg}`;
        });

        return msg;
      },
    }),

    anotherFmt: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "[{loggerName}] - {datetime} - {levelName} {msg}",
    }),
  },

  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["stringFmt"],
    },
    dataLogger: {
      level: "INFO",
      handlers: ["anotherFmt"],
    },
  },
});

const dictHandler = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (q) {
    const sql = `SELECT * FROM stardict WHERE word = ?`;
    const rows = await excuteSql(sql, [q]);
    const [data] = <Dict[]>rows;
    return data;
  }
};

const loginHandler = async (req: Request) => {
  if (req.body) {
    const body = await req.json();
    const { username, password } = body;
    const cryptoPs = await crypto.subtle.digest(
      "MD5",
      new TextEncoder().encode(password)
    );
    const sql = `SELECT name,password,email,profile_image as profileImage FROM users WHERE name = ?`;
    const rows = await excuteSql(sql, [username]);
    const [user] = <User[]>rows;
    const { password: ps, ...rest } = user;
    if (toHashString(cryptoPs) === ps) {
      const alg = "HS256";
      const jwt = await new jose.SignJWT({ username, password })
        .setProtectedHeader({ alg })
        .sign(secret);
      return { ...rest, token: jwt };
    }
  }
};

const recordAdd = async (
  recordType: RecordType,
  userId: User["id"],
  payload: WordRecord
) => {
  const { text, title, url, favIconUrl, translation } = payload;
  const create_at = dateFormat(new Date(), "yyyy-MM-dd HH:mm:ss");
  const uuid = await generate(
    NAMESPACE_URL,
    new TextEncoder().encode(recordType + create_at + userId)
  );

  const querySql = `SELECT id FROM records WHERE text = ?`;
  const rows = await excuteSql(querySql, [text]);

  if (rows.length > 0) {
    return `add ${recordType === "2" ? "favorite" : "history"} success`;
  }
  const formatTranslation = translation && JSON.stringify(translation);
  const favSql = `INSERT INTO records VALUES(?,?,?,?,?,?,?,?,?)`;
  await excuteSql(favSql, [
    uuid.replace(/-/g, "").slice(0, 24),
    text,
    url,
    title,
    favIconUrl,
    formatTranslation,
    recordType,
    create_at,
    String(userId),
  ]);
  return `add ${recordType === "2" ? "favorite" : "history"} success`;
};

const recordDelete = async (
  recordType: RecordType,
  text: WordRecord["text"]
) => {
  const deleteSql = `DELETE FROM records WHERE text = ? and record_type = ?`;
  await excuteSql(deleteSql, [text, recordType]);
  return "delete success";
};

const recordHandler = async (req: Request) => {
  const token = req.headers.get("x-token")!;
  const { searchParams } = new URL(req.url);
  const recordType = searchParams.get("type") as RecordType | null;
  const { payload } = await jose.jwtVerify(token, secret);
  const { username, password } = payload as User;
  const cryptoPs = await crypto.subtle.digest(
    "MD5",
    new TextEncoder().encode(password)
  );
  const userSql = `SELECT id,name,password FROM users WHERE name = ? and password = ?`;
  const [user] = await excuteSql<User>(userSql, [
    username,
    toHashString(cryptoPs),
  ]);
  const method = req.method.toLocaleLowerCase();

  if (recordType && user?.id) {
    if (method === "post") {
      const body = await req.json();
      if (req.body) {
        return recordAdd(recordType, user.id, body);
      }
    } else if (method === "get") {
      const recordSql = `SELECT url,favIconUrl,text,title,translation,created_at FROM records WHERE created_by = ? and record_type = ?`;
      const rows: Array<WordRecord> = await excuteSql(recordSql, [
        String(user.id),
        recordType,
      ]);
      return rows.map(({ translation, created_at, ...rest }) => {
        return {
          ...rest,
          translation: translation && JSON.parse(translation),
          date: new Date(created_at).getTime(),
        };
      });
    } else if (method === "delete") {
      const body = await req.json();
      const { text } = body;
      if (text) {
        return recordDelete(recordType, text);
      }
    }
  }
};

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
      const data = await loginHandler(req);
      if (data) {
        ret.code = ApiCode.SUCCESS;
        ret.data = data;
      } else {
        ret.code = ApiCode.NO_QUERY_RESULT;
      }
    } else if (pathname === "/records") {
      const data = await recordHandler(req);
      if (typeof data === "string") {
        ret.code = ApiCode.SUCCESS;
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
