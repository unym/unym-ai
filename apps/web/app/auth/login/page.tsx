import { LoginForm } from "@/components/app/login-form"
import { Suspense } from "react"

export const metadata = {
  title: "Sign in — unym",
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
