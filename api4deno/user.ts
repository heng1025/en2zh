import { excuteSql } from "./dbHelper.ts";
import { jose, crypto, toHashString } from "./deps.ts";
import { User } from "./model.ts";

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
    const { password: ps, ...rest } = user || {};
    if (toHashString(cryptoPs) === ps) {
      const alg = "HS256";
      const secret = new TextEncoder().encode(Deno.env.get("SECRET"));
      const jwt = await new jose.SignJWT({ username, password })
        .setProtectedHeader({ alg })
        .sign(secret);
      return { ...rest, token: jwt };
    } else {
      throw new Error("username or password error");
    }
  }
};

export { loginHandler };
