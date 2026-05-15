import LoginForm from "@/components/forms/LoginForm";
import AuthLayout from "@/layouts/AuthLayout";

const LoginPage = () => {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your GymPro account"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;