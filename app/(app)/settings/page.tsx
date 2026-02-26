import PageWrapper from "@/components/PageWrapper";

export const metadata = {
  title: "Settings | Momentum",
};

export default function SettingsPage() {
  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Settings</h1>
      <p className="mt-1 text-sm text-stone-500">Manage your account preferences.</p>
      <div className="mt-6 rounded-2xl bg-white p-8 shadow-md">
        <p className="text-sm text-stone-400">Settings coming soon.</p>
      </div>
    </PageWrapper>
  );
}
