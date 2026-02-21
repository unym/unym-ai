"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const CONFIRMATION_TEXT = "DELETE"

export function DeleteAccount() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (confirmInput !== CONFIRMATION_TEXT) return
    setError(null)
    setLoading(true)

    const { error: deleteError } = await authClient.deleteUser({
      callbackURL: "/?deleted=true",
    })
    setLoading(false)

    if (deleteError) {
      setError(deleteError.message ?? "Account deletion failed. Please try again.")
      return
    }

    router.push("/?deleted=true")
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800">Delete account</h2>
      <p className="mt-1 text-sm text-red-700">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Delete my account
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete your account?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              All your data will be permanently deleted. This action cannot be undone.
            </p>
            <p className="mt-4 text-sm font-medium text-gray-700">
              Type <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm"
              placeholder={CONFIRMATION_TEXT}
              autoFocus
            />

            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmInput !== CONFIRMATION_TEXT || loading}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Delete account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setConfirmInput("")
                  setError(null)
                }}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
