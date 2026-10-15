import { MissionDetail } from "@/components/missions/MissionDetail";

export default function BrandMissionPage({ params }: { params: { id: string } }) {
  return <MissionDetail id={params.id} role="brand" />;
}
