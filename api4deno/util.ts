const enum ApiCode {
  SUCCESS = 0,
  URL_INCORRECT = 3001,
  NO_QUERY_RESULT = 3002,
  SERVICE_ERROR = 3003,
}

const apiMessageMap = new Map<ApiCode, string>([
  [ApiCode.SUCCESS, "success"],
  [ApiCode.URL_INCORRECT, "url is incorrect,try /dict?q=hello"],
  [ApiCode.NO_QUERY_RESULT, "query fail"],
  [ApiCode.SERVICE_ERROR, "service error"],
]);

type Dict = {
  id: number;
  word: string;
  sw: string;
  phonetic: string;
  definition: string;
  translation: string;
  pos: string;
  collins: number;
  oxford: number;
  tag: string;
  bnc: number;
  frq: number;
  exchange: string;
  detail: string;
  audio: string;
};

type ApiRes = {
  code: number;
  msg: string;
  data?: Dict;
};

export { apiMessageMap, ApiCode };
export type { ApiRes, Dict };
