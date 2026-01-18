import { SearchableList } from "@/components/task/ui/SeachableList";
import { selectItemAction } from "../../components/task/action/action";
import { getItems, getStats } from "../data";

export default async function Page() {
  const [list, stats] = await Promise.all([getItems(), getStats()]);

  return (
    <SearchableList list={list} stats={stats} onSelect={selectItemAction} />
  );
}
