import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let handler: any;

async function getApolloHandler() {
  if (!handler) {
    const { ApolloServer } = await import("@apollo/server");
    const { startServerAndCreateNextHandler } = await import(
      "@as-integrations/next"
    );
    const schemaModule = await import("@/graphql/schema");
    const schema = schemaModule.schema;

    const server = new ApolloServer({ schema });

    handler = startServerAndCreateNextHandler(server, {
      context: async (req) => ({ req }),
    });
  }
  return handler;
}

export async function GET(req: NextRequest) {
  return (await getApolloHandler())(req);
}

export async function POST(req: NextRequest) {
  return (await getApolloHandler())(req);
}
