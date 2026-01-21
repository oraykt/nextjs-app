import { auth } from "@/lib/auth";
import { MovieListView } from "@/pages/movie/ui/list-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function MoviePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.movies.getMany.queryOptions());
  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div>Loading movies...</div>}>
          <ErrorBoundary fallback={<div>Failed to load movies.</div>}>
            <MovieListView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
