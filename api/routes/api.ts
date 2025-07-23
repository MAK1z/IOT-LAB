import { Hono } from "hono";
import booksRouter from "./books.js";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";
import { Myinfo } from "../db/schema.js";

const apiRouter = new Hono();

apiRouter.get("/", (c) => {
  return c.json({ message: "Student API" });
});

apiRouter.use(
  "*",
  bearerAuth({
    verifyToken: async (token, c) => {
      const { API_SECRET } = env<{ API_SECRET: string }>(c);
      return token === API_SECRET;
    },
  })
);

apiRouter.get("/myinfo", async (c) => {
  const allStudent = await drizzle.select().from(Myinfo);
  return c.json(allStudent);
});

apiRouter.get("/myinfo:id", async (c) => {
  const id = Number(c.req.param("Stdid"));
  const result = await drizzle.query.Myinfo.findFirst({
    where: eq(Myinfo.Stdid, stdid),
    with: {
      genre: true,
    },
  });
  if (!result) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json(result);
});

apiRouter.post("/student", async (c) => {
  const body = await c.req.json(); 
  if (typeof body !== 'object' || body === null) {
    return c.json({ success: false, message: "Invalid request body format" }, 400);
  }
  const { Name, SurName, Stdid, DoB, Sex } = body;
   
  if (!isValidString(Name)) return c.json({ success: false, message: "firstName is required" }, 400);
  if(!isValidString(SurName)) return c.json({ success: false, message: "lastName is required" }, 400);
  if(!isValidString(Stdid)) return c.json({ success: false, message: "studentId is required" }, 400);
  const birthDateString = parseDate(DoB);
  if (!birthDateString) return c.json({ success: false, message: "birthDate must be a valid date string" }, 400);
  if(!isValidString(Sex)) return c.json({ success: false, message: "gender is required" }, 400);
  const result = await drizzle
    .insert(Myinfo)
    .values({
      Name,
      SurName,
      Stdid,
      DoB,
      Sex,
    })
    .returning();
  return c.json({ success: true, students: result[0] }, 201);
});

apiRouter.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      Name: z.string().min(1).optional(),
      SurName: z.string().min(1).optional(),
      Stdid: z.string().min(1).optional(),
      DoB: z.string().min(1).optional(),
      Sex: z.string().min(1).optional()
    })
  ),
  async (c) => {
    const id = Number(c.req.param("Stdid"));
    const data = c.req.valid("json");
    const updated = await drizzle.update(Myinfo).set(data).where(eq(Myinfo.Stdid, id)).returning();
    if (updated.length === 0) {
      return c.json({ error: "Book not found" }, 404);
    }
    return c.json({ success: true, book: updated[0] });
  }
);

apiRouter.delete("/:id", async (c) => {
  const id = Number(c.req.param("Stdid"));
  const deleted = await drizzle.delete(Myinfo).where(eq(Myinfo.Stdid, id)).returning();
  if (deleted.length === 0) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json({ success: true, book: deleted[0] });
});

export default apiRouter;
