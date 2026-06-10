import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import { ThemeProvider } from "./theme/ThemeProvider";
import { ModeProvider } from "./mode/ModeProvider";
import { ThemeModeSync } from "./theme/ThemeModeSync";
import { OverlayProvider } from "./intents/OverlayContext";
import { GalleryProvider } from "./intents/GalleryContext";
import { KeyboardController } from "./intents/KeyboardController";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SpatialCursor } from "./components/SpatialCursor";
import { OverlayHost } from "./overlays/OverlayHost";
import { ROUTE_BY_ID, ID_BY_PATH } from "./intents/actions";

const Home     = lazy(() => import("./pages/Home"));
const About    = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Projects = lazy(() => import("./pages/Projects"));
const Contact  = lazy(() => import("./pages/Contact"));
const Log      = lazy(() => import("./pages/Log"));

function ScreenLabel({ children }) {
  const { pathname } = useLocation();
  const id = ID_BY_PATH[pathname] ?? "home";
  const num = String(["home","about","services","projects","contact","log"].indexOf(id) + 1).padStart(2, "0");
  const label = id[0].toUpperCase() + id.slice(1);
  return (
    <div className="app-shell" data-screen-label={`${num} ${label}`}>
      {children}
    </div>
  );
}

function RouteFallback() {
  return (
    <div style={{ padding: 80, fontFamily: "var(--f-mono)", color: "var(--muted)" }}>
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ModeProvider>
        <GalleryProvider>
          <OverlayProvider>
            <BrowserRouter>
              <ThemeModeSync />
              <KeyboardController />
              <SpatialCursor mode="dot" />
              <div className="grain" aria-hidden="true" />
              <ScreenLabel>
                <Header />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path={ROUTE_BY_ID.home}     element={<Home />} />
                    <Route path={ROUTE_BY_ID.about}    element={<About />} />
                    <Route path={ROUTE_BY_ID.services} element={<Services />} />
                    <Route path={ROUTE_BY_ID.projects} element={<Projects />} />
                    <Route path={ROUTE_BY_ID.contact}  element={<Contact />} />
                    <Route path={ROUTE_BY_ID.log}      element={<Log />} />
                  </Routes>
                </Suspense>
                <Footer />
              </ScreenLabel>
              <OverlayHost />
            </BrowserRouter>
          </OverlayProvider>
        </GalleryProvider>
      </ModeProvider>
    </ThemeProvider>
  );
}
