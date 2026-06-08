import WorkoutPlansManager from "@/components/stage4/WorkoutPlansManager";

// Member list is role-scoped server-side, so an ADMIN sees every member while a
// TRAINER only sees their assigned members — the same manager serves both.
export default function WorkoutPlansPage() {
  return <WorkoutPlansManager />;
}
