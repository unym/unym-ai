import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/app/settings-form"
import { DeleteAccount } from "@/components/app/delete-account"
import { LogoutButton } from "@/components/app/logout-button"

export const metadata = {
  title: "Account settings — unym",
}

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const { user } = session

  // Determine auth method by querying linked accounts
  const accounts = await db.account.findMany({
    where: { userId: user.id },
    select: { providerId: true },
  })
  const hasGoogle = accounts.some((a) => a.providerId === "google")
  const authMethod: "google" | "email" = hasGoogle ? "google" : "email"

  const createdAt = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account information and preferences.
        </p>
      </div>

      {/* Account info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Account information</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="font-medium text-gray-600">Email</dt>
            <dd className="text-gray-900">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-gray-600">Sign-in method</dt>
            <dd className="text-gray-900">
              {authMethod === "google" ? "Google" : "Email / password"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-gray-600">Member since</dt>
            <dd className="text-gray-900">{createdAt}</dd>
          </div>
        </dl>
      </div>

      {/* Password change (email users only) */}
      <SettingsForm authMethod={authMethod} />

      {/* Sign out */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Session</h2>
        <p className="mt-1 text-sm text-gray-600">Sign out of your account on this device.</p>
        <LogoutButton className="mt-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-gray-600" />
      </div>

      {/* Delete account */}
      <DeleteAccount />
    </div>
  )
}
