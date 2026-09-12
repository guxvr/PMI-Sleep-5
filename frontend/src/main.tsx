import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";
import App from "./App";
import { StoreProvider } from "./services/store";
const theme = createTheme({
  primaryColor: "forest",
  colors: {
    forest: [
      "#edf6f1",
      "#d7eade",
      "#afd3bc",
      "#83bb99",
      "#60a67d",
      "#479a6b",
      "#38875b",
      "#2d774e",
      "#206442",
      "#155438",
    ],
  },
  fontFamily: "Inter Variable, sans-serif",
  headings: { fontFamily: "Manrope Variable, sans-serif" },
  defaultRadius: "md",
  fontSizes: { sm: "0.81rem", md: "0.875rem" },
  components: {
    Button: { defaultProps: { fw: 600 } },
    Modal: { defaultProps: { radius: "lg" } },
    Tooltip: { defaultProps: { withArrow: true } },
  },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="light">
      <Notifications position="top-right" />
      <BrowserRouter>
        <StoreProvider>
          <App />
        </StoreProvider>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);
