import { redirect } from "next/navigation"

export default async function Home() {
  // Go to auth page first
  redirect("/auth")
}
