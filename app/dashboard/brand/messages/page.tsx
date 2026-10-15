import { createClient } from "@/lib/supabase/server";
import { MessagesClient } from "@/components/messages/MessagesClient";

export default async function MessagesPage({ searchParams }: { searchParams: { c?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <MessagesClient role="brand" userId={user!.id} initialConversationId={searchParams.c} />;
}
