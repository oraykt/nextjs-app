import { MovieViewById } from "@/pages/movie/ui/view-by-id";

interface MovieByIdPageProps {
  params: { id: string };
}

export default async function MovieByIdPage(props: MovieByIdPageProps) {
  const params = await props.params;
  return <MovieViewById movieId={params.id} />;
}
