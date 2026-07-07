import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/dashboard" className="font-semibold text-teal-800">
            {session.agency.name}
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="text-stone-600 hover:text-teal-700">
              Tableau de bord
            </Link>
            <Link href="/candidats" className="text-stone-600 hover:text-teal-700">
              CVthèque
            </Link>
            <Link href="/mandats" className="text-stone-600 hover:text-teal-700">
              Mandats
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-stone-500">
            <span className="hidden sm:inline">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
