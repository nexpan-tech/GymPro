import PageHeader from "@/components/common/PageHeader";
import ProgressManager from "@/components/stage5/ProgressManager";

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Progress"
        description="Track your measurable fitness progress — weight, BMI, body fat, and more."
      />
      <ProgressManager scope="my" canEdit />
    </div>
  );
}
