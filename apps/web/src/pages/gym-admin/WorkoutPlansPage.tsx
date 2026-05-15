import Page from "@/components/ui/Page";

export default function WorkoutPlansPage() {
  return (
    <Page
      title="Workout Plans"
      description="Manage your gym's workout plans and trainer routines."
    >
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This page provides an overview of your workout plans and routines. Use the sidebar to navigate to specific plan management tools.
        </p>
      </div>
    </Page>
  );
}
