import "https://deno.land/std@0.194.0/dotenv/load.ts";

import {
  jose,
  serve,
  format,
  generate,
  crypto,
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
  type Record,
} from "./model.ts";

const port = Deno.env.get("SERVER_PORT") || "8000";
const secret = new TextEncoder().encode("hEll0W_rld.");

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

const recordAdd = async (userId: number, payload: Record) => {
  const { text, title, recordType, url, favIconUrl } = payload;
  const create_at = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  const uuid = await generate(
    NAMESPACE_URL,
    new TextEncoder().encode(recordType + create_at + userId)
  );

  const querySql = `SELECT id from records WHERE text = ?`;

  const rows = await excuteSql(querySql, [text]);

  if (rows.length > 0) {
    return `add ${recordType === "2" ? "favorite" : "history"} success`;
  }

  const favSql = `INSERT INTO records (id,record_type,text,title,url,favIconUrl,created_at,created_by) VALUES(?,?,?,?,?,?,?,?)`;
  await excuteSql(favSql, [
    uuid.replace(/-/g, "").slice(0, 24),
    recordType,
    text,
    title,
    url,
    favIconUrl,
    create_at,
    String(userId),
  ]);
  return `add ${recordType === "2" ? "favorite" : "history"} success`;
};

const recordHandler = async (req: Request) => {
  const token = req.headers.get("x-token")!;
  const { payload } = await jose.jwtVerify(token, secret);
  const { username, password } = payload as User;
  const cryptoPs = await crypto.subtle.digest(
    "MD5",
    new TextEncoder().encode(password)
  );
  const userSql = `SELECT id,name,password FROM users WHERE name = ? and password = ?`;
  const [user] = await excuteSql<User>(userSql, [username, toHashString(cryptoPs)]);
  const method = req.method.toLocaleLowerCase();

  if (method === "post") {
    const body = await req.json();
    if (req.body && user?.id) {
      return recordAdd(user.id, body);
    }
  } else if (method === "get") {
    const { searchParams } = new URL(req.url);
    const recordType = searchParams.get("type");
    if (recordType && user?.id) {
      const recordSql = `SELECT * FROM records WHERE created_by = ? and record_type = ?`;
      const rows = await excuteSql(recordSql, [String(user.id), recordType]);
      return rows;
    }
  }
};

const handler = async (req: Request) => {
  const ret = {} as ApiRes<Dict | User | Record | string | unknown>;
  const { pathname } = new URL(req.url);
  if (pathname === "/dict") {
    const data = await dictHandler(req);
    if (data) {
      ret.data = data;
    }
  } else if (pathname === "/login") {
    const data = await loginHandler(req);
    if (data) {
      ret.data = data;
    }
  } else if (pathname === "/records") {
    const data = await recordHandler(req);
    if (data) {
      ret.data = data;
    }
  } else {
    ret.code = ApiCode.URL_INCORRECT;
  }

  if (ret.data) {
    ret.code = ApiCode.SUCCESS;
  } else {
    ret.code = ApiCode.NO_QUERY_RESULT;
  }
  ret.msg = apiMessageMap.get(ret.code) || "Oops,err!";
  return Response.json(ret);
};

await serve(handler, { port: parseInt(port) });
