import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

// Split-screen sign-in page; the two-column layout lives in the (auth) layout.
export default function LoginPage() {
  return <LoginForm />;
}
