import { createDbWorker } from "sql.js-httpvfs";
import "./main.css";

const workerUrl = new URL(
  "sql.js-httpvfs/dist/sqlite.worker.js",
  import.meta.url
);
const wasmUrl = new URL("sql.js-httpvfs/dist/sql-wasm.wasm", import.meta.url);

async function search(text) {
  const worker = await createDbWorker(
    [
      {
        from: "inline",
        config: {
          serverMode: "full",
          url: "/webdict.db",
          requestChunkSize: 1024 * 32,
        },
      },
    ],
    workerUrl.toString(),
    wasmUrl.toString()
  );

  return worker.db.query(`SELECT * FROM stardict WHERE word=?`, [text]);
}

function splitWrap(text) {
  return text.split("\n").reduce((acc, v) => {
    acc += `<p class="divide">${v}</p>`;
    return acc;
  }, "");
}

function splitNowrap(text, sep) {
  return text.split(sep).reduce((acc, v) => {
    acc += `<span class="separator">${v}</span>`;
    return acc;
  }, "");
}

function generateResult(result) {
  const { word, phonetic, tag, translation, definition, exchange: ex } = result;
  const voiceEl =
    phonetic &&
    `<p class="voice-wrap">
      <span>[${phonetic || "-"}]</span>
      <img id="voice" data-text=${word} class="icon" src="/Speaker.svg"/>
    </p>`;
  const transEl = translation && `<div>${splitWrap(translation)}</div>`;
  const defEl = definition && `<div>${splitWrap(definition)}</div>`;
  const exEl = ex && `<p class="sep-wrap ex-wrap">${splitNowrap(ex, "/")}</p>`;
  const tagEls =
    tag && `<p class="sep-wrap tag-wrap">${splitNowrap(tag, " ")}</p>`;

  return `<h2>${word}</h2>${voiceEl}${transEl}${defEl}${exEl}${tagEls}`;
}

const $input = document.querySelector("#wordInput");
const $button = document.querySelector("#btn");
const $result = document.querySelector("#result");

async function show() {
  $result.innerHTML = "loading...";
  const words = $input.value || "hello world";
  const [result] = await search(words);

  if (result) {
    $result.innerHTML = generateResult(result);
  } else {
    $result.innerHTML = "Query is empty!";
  }
}

$input.addEventListener("keydown", (ev) => {
  // Enter
  if (ev.keyCode === 13) {
    show();
  }
});

$button.addEventListener("click", async () => {
  show();
});

$result.addEventListener("click", (ev) => {
  if (ev.target.id === "voice") {
    const { text } = ev.target.dataset;
    const src = `https://dict.youdao.com/dictvoice?audio=${text}&type=1`;
    const audio = new Audio(src);
    audio.play();
  }
});
