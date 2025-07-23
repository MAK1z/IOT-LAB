import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

export const Myinfo = t.pgTable("Myinfo", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  Name: t
    .varchar({
      length: 255,
    })
    .notNull(),
  Surname: t
    .varchar({
      length: 255,
    })
    .notNull(),
  Stdid: t
    .varchar({
      length: 255,
    })
    .notNull(),
  DoB: t
    .varchar({
      length: 255,
    })
    .notNull(),
  Sex: t
    .varchar({
      length: 255,
    })
    .notNull(),
  
});

