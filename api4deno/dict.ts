import { excuteSql } from "./dbHelper.ts";
import { EmptyError } from "./error.ts";
import { ApiCode, Dict, apiMessageMap } from "./model.ts";

const dictHandler = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (q) {
    const sql = `SELECT * FROM stardict WHERE word = ?`;
    const rows = await excuteSql<Dict>(sql, [q]);
    if (rows.length > 0) {
      return rows[0];
    }
  }
  const errMsg = apiMessageMap.get(ApiCode.NO_QUERY_RESULT) || "Ops!"
  throw new EmptyError(errMsg);
};

export { dictHandler };
