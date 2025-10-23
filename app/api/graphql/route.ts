import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

let handler: ReturnType<
  typeof import("@as-integrations/next").startServerAndCreateNextHandler
> | null = null;

async function getApolloHandler() {
  if (!handler) {
    const { ApolloServer } = await import("@apollo/server");
    const { startServerAndCreateNextHandler } = await import(
      "@as-integrations/next"
    );
    const { schema } = await import("@/graphql/schema");

    const server = new ApolloServer({
      schema,
      introspection: process.env.NODE_ENV !== "production",
    });

    handler = startServerAndCreateNextHandler<NextRequest>(server, {
      context: async (req) => {
        const headers = Object.fromEntries(req.headers);

        return { req, headers };
      },
    });
  }

  return handler;
}

export async function POST(req: NextRequest) {
  const apolloHandler = await getApolloHandler();
  return apolloHandler(req);
}

export async function GET(req: NextRequest) {
  const apolloHandler = await getApolloHandler();
  return apolloHandler(req);
}
