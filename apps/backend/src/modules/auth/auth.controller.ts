import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validation";

export class AuthController {
  static async register(req: Request, res: Response) {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data);

    res.json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  }

  static async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data);

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }

  static async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await AuthService.me(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  }
}