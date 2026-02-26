import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TimetableClient from "@/components/TimetableClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Timetable | Momentum",
};

export default async function TimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return <TimetableClient />;
}
