import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreatorProfileView } from "@/components/profile/CreatorProfileView";

export default async function CreatorOwnProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[18px] font-semibold text-ink">Votre profil public</h2>
        <Link href="/dashboard/creator/profile/edit" className="btn-primary">
          Modifier mon profil
        </Link>
      </div>
      <CreatorProfileView creatorId={user!.id} />
    </div>
  );
}
