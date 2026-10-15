import { MissionDetail } from "@/components/missions/MissionDetail";

export default function CreatorMissionPage({ params }: { params: { id: string } }) {
  return <MissionDetail id={params.id} role="creator" />;
}
