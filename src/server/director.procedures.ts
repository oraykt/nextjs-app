import { db } from "@/db";
import { directors, movies } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { SecurityLogger } from "@/lib/security-logger";
import { TRPCError } from "@trpc/server";
import { eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";

export const directorsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const {
        auth: {
          user: { id: authorizedUserId },
        },
      } = ctx;

      try {
        const [existingDirector] = await db
          .select({
            ...getTableColumns(directors),
          })
          .from(directors)
          .where(eq(directors.id, input.id))
          .limit(1);

        if (!existingDirector) {
          SecurityLogger.logFailure({
            userId: authorizedUserId,
            action: "directors.getOne",
            resource: "director",
            resourceId: input.id,
            error: "Director not found",
          });

          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Director with id ${input.id} not found`,
          });
        }

        const directorMovies = await db
          .select({
            id: movies.id,
            title: movies.title,
            releaseDate: movies.releaseDate,
            genre: movies.genre,
            rating: movies.rating,
            posterUrl: movies.posterUrl,
          })
          .from(movies)
          .where(eq(movies.directorId, input.id));

        SecurityLogger.logSuccess({
          userId: authorizedUserId,
          action: "directors.getOne",
          resource: "director",
          resourceId: input.id,
        });

        return {
          ...existingDirector,
          movies: directorMovies,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        SecurityLogger.logFailure({
          userId: authorizedUserId,
          action: "directors.getOne",
          resource: "director",
          resourceId: input.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch director",
        });
      }
    }),

  getMany: protectedProcedure.query(async ({ ctx }) => {
    const {
      auth: {
        user: { id: authorizedUserId },
      },
    } = ctx;
    try {
      const allDirectors = await db
        .select({
          ...getTableColumns(directors),
        })
        .from(directors);

      const directorIds = allDirectors.map((d) => d.id);

      const allMovies =
        directorIds.length > 0
          ? await db
              .select({
                id: movies.id,
                title: movies.title,
                releaseDate: movies.releaseDate,
                genre: movies.genre,
                rating: movies.rating,
                posterUrl: movies.posterUrl,
                directorId: movies.directorId,
              })
              .from(movies)
              .where(eq(movies.directorId, directorIds[0]))
          : [];

      const moviesByDirector = allMovies.reduce(
        (acc, movie) => {
          if (movie.directorId) {
            if (!acc[movie.directorId]) {
              acc[movie.directorId] = [];
            }
            acc[movie.directorId].push(movie);
          }
          return acc;
        },
        {} as Record<string, typeof allMovies>,
      );

      const directorsWithMovies = allDirectors.map((director) => ({
        ...director,
        movies: moviesByDirector[director.id] || [],
      }));

      SecurityLogger.logSuccess({
        userId: authorizedUserId,
        action: "directors.getMany",
        resource: "director",
      });

      return directorsWithMovies;
    } catch (error) {
      SecurityLogger.logFailure({
        userId: authorizedUserId,
        action: "directors.getMany",
        resource: "director",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch directors",
      });
    }
  }),
});
