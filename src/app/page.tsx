import { createClient } from "@/lib/supabase/server"
import LandingPageNew from "@/components/landing/LandingPageNew"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Optionally redirect or show "Continue to Chat"
    // redirect("/chat") 
  }

  return <LandingPageNew user={user} />
}
