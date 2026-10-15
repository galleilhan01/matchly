import { createClient } from "@/lib/supabase/server";
import { CommissionForm } from "@/components/dashboard/CommissionForm";

export default async function AdminCommissionsPage() {
  const supabase = createClient();
  const { data } = await supabase.from("platform_settings").select("value").eq("key", "commission_rate").maybeSingle();
  const rate = Number(data?.value ?? 0.2);
  return (
    <div className="max-w-[560px]">
      <h1 className="font-display text-[26px] font-semibold text-ink">Commissions</h1>
      <p className="mb-6 mt-1 text-[14.5px] text-ink-soft">Pourcentage prélevé par la plateforme sur chaque mission.</p>
      <CommissionForm initialRate={rate} />
    </div>
  );
}
