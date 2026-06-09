import PageHeader from "@/components/common/PageHeader";
import MemberProgressReview from "@/components/stage5/MemberProgressReview";

export default function TrainerProgressPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Member Progress"
        description="Review and record measurable progress for your assigned members."
      />
      <MemberProgressReview />
    </div>
  );
}
