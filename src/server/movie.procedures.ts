import { db } from "@/db";
import { movies, directors } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { SecurityLogger } from "@/lib/security-logger";
import { TRPCError } from "@trpc/server";
import { eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";

export const moviesRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const {
        auth: {
          user: { id: authorizedUserId },
        },
      } = ctx;

      try {
        const [existingMovie] = await db
          .select({
            ...getTableColumns(movies),
            director: {
              id: directors.id,
              name: directors.name,
              bio: directors.bio,
              birthDate: directors.birthDate,
              nationality: directors.nationality,
              imageUrl: directors.imageUrl,
            },
          })
          .from(movies)
          .leftJoin(directors, eq(movies.directorId, directors.id))
          .where(eq(movies.id, input.id))
          .limit(1);

        if (!existingMovie) {
          SecurityLogger.logFailure({
            userId: authorizedUserId,
            action: "movies.getOne",
            resource: "movie",
            resourceId: input.id,
            error: "Movie not found",
          });

          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Movie with id ${input.id} not found`,
          });
        }

        SecurityLogger.logSuccess({
          userId: authorizedUserId,
          action: "movies.getOne",
          resource: "movie",
          resourceId: input.id,
        });

        return existingMovie;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        SecurityLogger.logFailure({
          userId: authorizedUserId,
          action: "movies.getOne",
          resource: "movie",
          resourceId: input.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch movie",
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
      const allMovies = await db
        .select({
          ...getTableColumns(movies),
          director: {
            id: directors.id,
            name: directors.name,
            nationality: directors.nationality,
          },
        })
        .from(movies)
        .leftJoin(directors, eq(movies.directorId, directors.id));

      SecurityLogger.logSuccess({
        userId: authorizedUserId,
        action: "movies.getMany",
        resource: "movie",
      });

      return allMovies;
    } catch (error) {
      SecurityLogger.logFailure({
        userId: authorizedUserId,
        action: "movies.getMany",
        resource: "movie",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch movies",
      });
    }
  }),
});
