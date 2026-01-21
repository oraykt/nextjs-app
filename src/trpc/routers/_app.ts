import { createTRPCRouter } from "@/trpc/init";
import { directorsRouter } from "@/server/director.procedures";
import { moviesRouter } from "@/server/movie.procedures";

export const appRouter = createTRPCRouter({
  directors: directorsRouter,
  movies: moviesRouter,
});

export type AppRouter = typeof appRouter;
