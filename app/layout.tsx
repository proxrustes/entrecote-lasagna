"use client";

import * as React from "react";
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import { Header } from "../components/Header";
import { theme } from "../styles/theme";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Header />
          <Container maxWidth="md" sx={{ py: 4 }}>
            {children}
          </Container>
        </ThemeProvider>
      </body>
    </html>
  );
}
