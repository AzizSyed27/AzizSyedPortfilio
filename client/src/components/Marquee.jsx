export function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-inner">
        {doubled.map((it, i) => (
          <span key={i}><b>·</b> {it}</span>
        ))}
      </div>
    </div>
  );
}
