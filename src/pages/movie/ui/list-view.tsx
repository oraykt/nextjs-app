"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const MovieListView = () => {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: movies } = useSuspenseQuery(trpc.movies.getMany.queryOptions());

  return (
    <div className="flex flex-col-4 gap-2">
      {movies?.map((movie) => (
        <div
          key={movie.id}
          className="border p-4 rounded cursor-pointer hover:bg-gray-100"
          onClick={() => router.push(`/movies/${movie.id}`)}
        >
          <h2 className="text-lg font-bold mb-2">{movie.title}</h2>
          {movie.director?.name && (
            <p className="text-sm text-gray-600 mb-1">
              Directed by: {movie.director.name}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
