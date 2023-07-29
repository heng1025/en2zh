import { dictHandler } from "./dict.ts";
import { recordHandler } from "./record.ts";
import { loginHandler } from "./user.ts";

const route = new Map();

route.set("/dict", dictHandler);
route.set("/records", recordHandler);
route.set("/login", loginHandler);

export { route };
