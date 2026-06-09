import Page from "@/components/ui/Page";
import MemberProgressReview from "@/components/stage5/MemberProgressReview";

export default function ProgressPage() {
  return (
    <Page title="Progress" description="Review measurable member progress across your gym.">
      <MemberProgressReview />
    </Page>
  );
}
