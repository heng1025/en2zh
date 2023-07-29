import {
  dateFormat,
  generate,
  crypto,
  jose,
  NAMESPACE_URL,
  toHashString,
} from "./deps.ts";
import { excuteSql } from "./dbHelper.ts";
import { type User, type WordRecord, type RecordType } from "./model.ts";

const addRecord = async (
  recordType: RecordType,
  userId: User["id"],
  payload: WordRecord
) => {
  const { text, title, url, favIconUrl, translation } = payload;
  const created_at = dateFormat(new Date(), "yyyy-MM-dd HH:mm:ss");
  const uuid = await generate(
    NAMESPACE_URL,
    new TextEncoder().encode(text + created_at + recordType + userId)
  );

  const querySql = `SELECT id FROM records WHERE text = ?`;
  const rows = await excuteSql(querySql, [text]);

  if (rows.length > 0) {
    return "record already exists";
  }
  const formatTranslation = translation && JSON.stringify(translation);
  const favSql = `INSERT INTO records VALUES (?,?,?,?,?,?,?,?,?)`;
  await excuteSql(favSql, [
    uuid.replace(/-/g, "").slice(0, 24),
    text,
    url,
    title,
    favIconUrl,
    formatTranslation,
    recordType,
    created_at,
    String(userId),
  ]);
  return `add ${recordType === "2" ? "favorite" : "history"} success`;
};

const addRecords = async (
  recordType: RecordType,
  userId: User["id"],
  payloads: WordRecord[]
) => {
  const params = [];
  const sqlPlaceholders: string[] = [];
  for await (const w of payloads) {
    const { text, title, url, favIconUrl, translation } = w;
    const created_at = dateFormat(new Date(), "yyyy-MM-dd HH:mm:ss");
    const uuid = await generate(
      NAMESPACE_URL,
      new TextEncoder().encode(text + created_at + recordType + userId)
    );

    const formatTranslation = translation && JSON.stringify(translation);
    params.push(
      ...[
        uuid.replace(/-/g, "").slice(0, 24),
        text,
        url,
        title,
        favIconUrl,
        formatTranslation,
        recordType,
        created_at,
        String(userId),
      ]
    );
    sqlPlaceholders.push("(?,?,?,?,?,?,?,?,?)");
  }

  const favSql = `INSERT INTO records VALUES ${sqlPlaceholders.join(",")}`;
  await excuteSql(favSql, params);
  return `add ${recordType === "2" ? "favorite" : "history"} success`;
};

const deleteRecords = async (
  recordType: RecordType,
  texts: WordRecord["text"][]
) => {
  const [sqlPlaceholder, sqlParams] = texts.reduce<string[][]>(
    (acc, text, idx) => {
      acc[0].push(`${idx !== 0 ? " or " : ""}(text = ? and record_type = ?)`);
      acc[1].push(text, recordType);
      return acc;
    },
    [[], []]
  );
  const deleteSql = `DELETE FROM records WHERE ${sqlPlaceholder.join("")}`;
  await excuteSql(deleteSql, sqlParams);
  return "delete success";
};

const getRecords = async (recordType: RecordType, userId: User["id"]) => {
  const recordSql = `SELECT url,favIconUrl,text,title,translation,created_at FROM records WHERE created_by = ? and record_type = ?`;
  const rows: Array<WordRecord> = await excuteSql(recordSql, [
    String(userId),
    recordType,
  ]);
  return rows.map(({ translation, created_at, ...rest }) => {
    return {
      ...rest,
      translation: translation && JSON.parse(translation),
      date: new Date(created_at).getTime(),
    };
  });
};

const recordHandler = async (req: Request, secret: Uint8Array) => {
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
      if (req.body) {
        const body = await req.json();
        if (body) {
          if (Array.isArray(body)) {
            return addRecords(recordType, user.id, body);
          }
          return addRecord(recordType, user.id, body);
        }
      }
    } else if (method === "get") {
      return getRecords(recordType, user.id);
    } else if (method === "delete") {
      if (req.body) {
        const body = await req.json();
        const { text } = body;
        if (Array.isArray(text)) {
          return deleteRecords(recordType, text);
        }
        return "text format invalid";
      }
    }
  }
};

export { recordHandler };
