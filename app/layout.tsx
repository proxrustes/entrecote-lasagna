"use client";

import * as React from "react";
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import { Header } from "../components/Header";
import { theme } from "../styles/theme";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Header />
            <Container maxWidth="xl" sx={{ py: 4 }}>
              {children}
            </Container>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
