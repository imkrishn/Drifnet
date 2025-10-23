import { NextRequest } from "next/server";
import { schema } from "@/graphql/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let handler: any = null;

async function getApolloHandler() {
  if (!handler) {
    const { ApolloServer } = await import("@apollo/server");
    const { startServerAndCreateNextHandler } = await import(
      "@as-integrations/next"
    );

    const server = new ApolloServer({
      schema,
    });

    handler = startServerAndCreateNextHandler<NextRequest>(server, {
      context: async (req) => ({
        req,
        headers: Object.fromEntries(req.headers),
      }),
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
