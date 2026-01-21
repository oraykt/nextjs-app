import { DirectorViewById } from "@/pages/director/ui/view-by-id";

interface Props {
  params: { directorId: string };
}

export default async function DirectorByIdPage(props: Props) {
  const params = await props.params;
  return <DirectorViewById directorId={params.directorId} />;
}
