import DietPlansManager from "@/components/stage4/DietPlansManager";

// Member list is role-scoped server-side (ADMIN → all, TRAINER → assigned).
export default function DietPlansPage() {
  return <DietPlansManager />;
}
