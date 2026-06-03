export function Section({ num, label, children, style }) {
  return (
    <section className="section" style={style}>
      <div className="section-label" data-num={num}>{label}</div>
      {children}
    </section>
  );
}
