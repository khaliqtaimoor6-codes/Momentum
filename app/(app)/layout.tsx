import Sidebar from "@/components/Sidebar";
import SmartNotifications from "@/components/SmartNotifications";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <SmartNotifications />
      <Sidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
