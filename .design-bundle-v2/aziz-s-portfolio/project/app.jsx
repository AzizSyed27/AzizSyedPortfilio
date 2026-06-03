// app.jsx — Router, Tweaks panel wiring

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "amber",
  "fontPair": "editorial",
  "cursor": "dot",
  "hero": "manifesto"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState("home");
  const [handState, setHandState] = React.useState("standby");
  const handTimer = React.useRef(null);

  // Hand Ctrl cycles: standby → calibrating → (auto) live → standby
  const advanceHand = React.useCallback(() => {
    setHandState((s) => {
      clearTimeout(handTimer.current);
      if (s === "standby") {
        handTimer.current = setTimeout(() => setHandState("live"), 1600);
        return "calibrating";
      }
      if (s === "calibrating") return "live";
      return "standby";
    });
  }, []);
  React.useEffect(() => () => clearTimeout(handTimer.current), []);

  // Apply theme + fonts whenever they change
  React.useEffect(() => {
    window.applyTheme(t.theme, t.fontPair);
  }, [t.theme, t.fontPair]);

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route]);

  // Keyboard shortcuts: 1-6 for routes
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches("input, textarea")) return;
      const map = { "1": "home", "2": "about", "3": "services", "4": "projects", "5": "contact", "6": "log" };
      if (map[e.key]) setRoute(map[e.key]);
      if (e.key.toLowerCase() === "h") advanceHand();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advanceHand]);

  const themePalettes = [
    ["#F2E0D0", "#6E88B0", "#1A1F2A"],
    ["#200F07", "#C5E384", "#F0EBE0"],
    ["#F4F6F1", "#7BAF85", "#1F1F1F"],
    ["#F8F5F2", "#385144", "#1F2A24"],
    ["#EAEBED", "#006989", "#0A1A22"],
    ["#00272B", "#E0FF4F", "#E8F4F5"],
    ["#2E382E", "#50C9CE", "#E8EEE8"],
    ["#3C1950", "#F0CDD2", "#F5E8EA"],
  ];
  const themeKeys = ["amber", "pistachio", "matcha", "moss", "dreamy", "chartreuse", "robin", "strawberry"];
  const themeIndex = Math.max(0, themeKeys.indexOf(t.theme));

  return (
    <>
      <div className="grain" />
      <SpatialCursor mode={t.cursor} />
      <HudOverlay on={handState === "live"} />

      <div className="app-shell" data-screen-label={routeLabel(route)}>
        <TopBar route={route} setRoute={setRoute} handState={handState} onAdvanceHand={advanceHand} theme={t.theme} setTheme={(v) => setTweak("theme", v)} />

        {route === "home" && <HomePage heroVariant={t.hero} setRoute={setRoute} />}
        {route === "about" && <AboutPage />}
        {route === "services" && <ServicesPage />}
        {route === "projects" && <ProjectsPage />}
        {route === "contact" && <ContactPage />}
        {route === "log" && <LogPage />}

        <footer className="bottom-strip">
          <span>© 2026 Aziz Syed · Built with care</span>
          <span>v3.0 · Spatial preview · Keys 1-6 navigate · H toggles HUD</span>
          <span><a href="https://github.com/AzizSyed27" data-cursor="hover">github.com/AzizSyed27</a></span>
        </footer>
      </div>

      <TweaksPanel title="Tweaks · Spatial">
        <TweakSection label="Theme" />
        <TweakColor
          label="Palette"
          value={themePalettes[themeIndex]}
          options={themePalettes}
          onChange={(p) => {
            const i = themePalettes.findIndex((x) => JSON.stringify(x) === JSON.stringify(p));
            if (i >= 0) setTweak("theme", themeKeys[i]);
          }}
        />
        <TweakSelect
          label="Theme name"
          value={t.theme}
          options={[
            { value: "amber", label: "Amber Smoke (default)" },
            { value: "pistachio", label: "Pistachio Frost" },
            { value: "matcha", label: "Matcha Mist" },
            { value: "moss", label: "Moss Velvet" },
            { value: "dreamy", label: "Dreamy Ocean" },
            { value: "chartreuse", label: "Chartreuse Lab" },
            { value: "robin", label: "Robin Egg" },
            { value: "strawberry", label: "Strawberry / Obsidian" },
          ]}
          onChange={(v) => setTweak("theme", v)}
        />

        <TweakSection label="Typography" />
        <TweakSelect
          label="Type pair"
          value={t.fontPair}
          options={[
            { value: "editorial", label: "Editorial (Instrument Serif)" },
            { value: "engineer", label: "Engineer (Space Grotesk)" },
            { value: "classic", label: "Classic (Newsreader)" },
            { value: "brutalist", label: "Brutalist (DM Mono)" },
          ]}
          onChange={(v) => setTweak("fontPair", v)}
        />

        <TweakSection label="Cursor" />
        <TweakRadio
          label="Style"
          value={t.cursor}
          options={["dot", "trail", "off"]}
          onChange={(v) => setTweak("cursor", v)}
        />
        <TweakSelect
          label="Or pick crosshair"
          value={t.cursor}
          options={[
            { value: "dot", label: "Dot (default)" },
            { value: "trail", label: "Trail" },
            { value: "crosshair", label: "Crosshair HUD" },
            { value: "off", label: "Off / native" },
          ]}
          onChange={(v) => setTweak("cursor", v)}
        />

        <TweakSection label="Hero layout" />
        <TweakRadio
          label="Variant"
          value={t.hero}
          options={[
            { value: "manifesto", label: "Manifesto" },
            { value: "spatial", label: "Spatial" },
            { value: "telemetry", label: "Telem" },
          ]}
          onChange={(v) => setTweak("hero", v)}
        />
      </TweaksPanel>
    </>
  );
}

function routeLabel(r) {
  const map = { home: "01 Home", about: "02 About", services: "03 Services", projects: "04 Projects", contact: "05 Contact", log: "06 Log" };
  return map[r] || r;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
