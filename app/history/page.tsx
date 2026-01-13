import History from "@/components/history/history";
import { getGameHistory } from "@/lib/dbWrk";

interface HistoryRow {
  id: number;
  round_start_time: string;
  a1: number | null;
  a2: number | null;
  b1: number | null;
  b2: number | null;
  c1: number | null;
  c2: number | null;
  created_at?: string;
}

export default async function ServerPage() {
  const result = await getGameHistory();

  // Properly type the result from the database
  const history = (Array.isArray(result) ? result : []) as HistoryRow[];

  return <History history={history} />;
}
