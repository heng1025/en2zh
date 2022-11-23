import { serve } from "https://deno.land/std@0.165.0/http/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";

const dbPath = `${Deno.cwd()}/ecdict.db`;

// read db
const db = new DB(dbPath, { mode: "read" });
const query = db.prepareQuery("SELECT * FROM stardict WHERE word = ?");

const port = 8080;

const handler = (req: Request): Response => {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q");
  if (q) {
    const result = query.firstEntry([q]);
    return new Response(JSON.stringify(result));
  }
  return new Response("Err happen");
};

console.log(`Start listening on port 8080 of localhost`);
await serve(handler, { port });
