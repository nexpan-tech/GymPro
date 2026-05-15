import * as z from "zod";

export const attendanceSchema = z.object({
  memberId: z.string(),
  date: z.string(),
  status: z.enum(["present", "absent"]),
});