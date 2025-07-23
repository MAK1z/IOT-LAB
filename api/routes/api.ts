import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";
import drizzle from "../db/drizzle.js";
import { Myinfo } from "../db/schema.js";
import { eq } from "drizzle-orm";
const apiRouter = new Hono();

function isValidString(str: any): str is string {
  return typeof str === "string" && str.trim().length > 0;
}

function parseDate(dateStr: any): string | null {
  if (typeof dateStr !== "string") return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
}

apiRouter.get("/", (c) => {
  return c.json({ message: "Student API" });
});

apiRouter.use(
  "/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      const { API_SECRET } = env<{ API_SECRET: string }>(c);
      return token === API_SECRET;
    },
  })
);

apiRouter.get("/student", async (c) => {
  const allStudent = await drizzle.select().from(Myinfo);
  return c.json(allStudent);
});

apiRouter.get("/student/:studentId", async (c) => {
  const studentId = c.req.param("studentId");
  const result = await drizzle.query.Myinfo.findFirst({
    where: eq(Myinfo.Stdid, studentId),
  });
  if (!result) {
    return c.json({ error: "Student not found" }, 404);
  }
  return c.json(result);
});

apiRouter.post("/student", async (c) => {
  const body = await c.req.json(); 
  if (typeof body !== 'object' || body === null) {
    return c.json({ success: false, message: "Invalid request body format" }, 400);
  }
  const { Name, Surname, Stdid, DoB, Sex } = body;
   
  if (!isValidString(Name)) return c.json({ success: false, message: "Name is required" }, 400);
  if(!isValidString(Surname)) return c.json({ success: false, message: "Lastname is required" }, 400);
  if(!isValidString(Stdid)) return c.json({ success: false, message: "studentId is required" }, 400);
  const birthDateString = parseDate(DoB);
  if (!isValidString(DoB)) return c.json({ success: false, message: "birthDate must be a valid date string" }, 400);
  if(!isValidString(Sex)) return c.json({ success: false, message: "gender is required" }, 400);
  const result = await drizzle
    .insert(Myinfo)
    .values({
      Name,
      Surname,
      Stdid,
      DoB,
      Sex,
    })
    .returning();
  return c.json({ success: true, Myinfo: result[0] }, 201);
});

apiRouter.patch("/student/:studentId", async (c) => {
  const body = await c.req.json();
  const studentId = c.req.param("studentId");

  if (typeof studentId !== "string" || studentId.trim() === "") {
    return c.json({ success: false, message: "Invalid studentId" }, 400);
  }

  const updates: any = {};
  if (isValidString(body.Name)) updates.Name = body.Name;
  if(!isValidString(body.Surname)) updates.Surname = body.Surname;
  if(!isValidString(body.Sex)) updates.Sex = body.Sex;
  const birthDateStr = parseDate(body.DoB);
  if (birthDateStr) {
    updates.birthDate = birthDateStr;
  } 
  else if (body.DoB !== undefined) {
    return c.json({ success: false, message: "Invalid birthDate format" }, 400);
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, message: "No valid fields to update" }, 400);
  }

  const updated = await drizzle
    .update(Myinfo)
    .set(updates)
    .where(eq(Myinfo.Stdid, studentId))
    .returning();

  if (updated.length === 0) {
    return c.json({ success: false, message: "Student not found" }, 404);
  }

  return c.json({ success: true, student: updated[0] });
});

apiRouter.delete("/student/:studentId", async (c) => {
  const studentId = c.req.param("studentId");
  const deleted = await drizzle.delete(Myinfo).where(eq(Myinfo.Stdid, studentId)).returning();
  if (deleted.length === 0) {
    return c.json({ error: "Student not found" }, 404);
  }
  return c.json({ success: true, students: deleted[0] });
});

export default apiRouter;