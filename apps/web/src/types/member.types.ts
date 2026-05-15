export interface Member {
  id: string;
  gymId: string;
  name: string;
  email: string;
  phone: string;
  age?: number;
  gender?: "male" | "female" | "other";
  status: "active" | "inactive";
  joinedAt: string;
}