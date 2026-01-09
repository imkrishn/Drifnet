"use client";

import React from "react";
import { ThemeProvider } from "../components/ThemeProvider";
import "react-loading-skeleton/dist/skeleton.css";
import Main from "../components/Main";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { ApolloProvider } from "@apollo/client/react";
import { client } from "@/lib/apolloClient";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isAuthOrStudioRoute =
    pathname.startsWith("/auth") || pathname.startsWith("/studio");

  return (
    <ApolloProvider client={client}>
      <Provider store={store}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster richColors position="top-center" />
          {isAuthOrStudioRoute ? children : <Main>{children}</Main>}
        </ThemeProvider>
      </Provider>
    </ApolloProvider>
  );
};

export default Providers;
