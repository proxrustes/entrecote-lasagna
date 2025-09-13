import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#16a34a", // emerald-600
      light: "#4ade80",
      dark: "#166534",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2563eb", // blue-600
      light: "#60a5fa",
      dark: "#1e40af",
      contrastText: "#ffffff",
    },
    success: { main: "#22c55e" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
    info: { main: "#0891b2" },
    background: {
      default: "#f7faf9",
      paper: "#ffffff",
    },
    divider: "#e5e7eb",
    text: {
      primary: "#111827",
      secondary: "#4b5563",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: [
      "Inter",
      "SF Pro Text",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
});
