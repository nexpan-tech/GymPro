import RegisterGymForm from "@/components/forms/RegisterGymForm";
import AuthLayout from "@/layouts/AuthLayout";

const RegisterGymPage = () => {
  return (
    <AuthLayout
      title="Register Your Gym"
      subtitle="Create your GymPro account and start managing your gym"
    >
      <RegisterGymForm />
    </AuthLayout>
  );
};

export default RegisterGymPage;