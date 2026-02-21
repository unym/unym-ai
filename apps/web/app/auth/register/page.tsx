import { RegisterForm } from "@/components/app/register-form"
import { Suspense } from "react"

export const metadata = {
  title: "Create account — unym",
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
