import { schema } from "@/graphql/schema";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { ApolloServer } from "@apollo/server";
import { NextRequest } from "next/server";

const server = new ApolloServer({
  schema,
});

const apolloHandler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
});

export async function GET(req: NextRequest, context: any) {
  return apolloHandler(req, context);
}

export async function POST(req: NextRequest, context: any) {
  return apolloHandler(req, context);
}
