import { excuteSql } from "./dbHelper.ts";
import { Dict } from "./model.ts";

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

export { dictHandler };
