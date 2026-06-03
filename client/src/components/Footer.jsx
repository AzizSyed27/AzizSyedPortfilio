export function Footer() {
  return (
    <footer className="bottom-strip">
      <span>© {new Date().getFullYear()} Aziz Syed · Built with care</span>
      <span>v3.0 · Spatial preview · Keys 1–6 navigate · H toggles cheat sheet · [ ] cycles themes</span>
      <span>
        <a href="https://github.com/AzizSyed27" data-cursor="hover" target="_blank" rel="noreferrer">
          github.com/AzizSyed27
        </a>
      </span>
    </footer>
  );
}
