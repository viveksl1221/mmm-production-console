// Instagram-style 3-column grid preview — arranges a client's posts the
// way they'd actually read on the profile grid (newest first, top-left),
// using each post's asset_url. Posts without an uploaded asset yet show a
// placeholder tile so gaps in creative production stay visible instead of
// just vanishing from the preview.
const FORMAT_BADGE = { Reel: '▶', Carousel: '▮▮' };

export default function GridPreview({ items }) {
  const sorted = [...items].sort((a, b) => b.week - a.week || b.num - a.num);

  if (!sorted.length) {
    return <div className="empty-state">No posts yet — add some on the Posts tab to preview the grid.</div>;
  }

  return (
    <div className="grid-preview">
      <div className="grid-preview-note">Newest first, top-left — matches how this reads on the real profile grid.</div>
      <div className="ig-grid">
        {sorted.map((item) => (
          <div className="ig-tile" key={item.num}>
            {item.assetUrl ? (
              <img className="ig-tile-img" src={item.assetUrl} alt={item.topic || ''} />
            ) : (
              <div className="ig-tile-empty">
                <div className="ig-tile-empty-format">{item.format}</div>
                <div className="ig-tile-empty-topic">{item.topic || '(untitled)'}</div>
              </div>
            )}
            {FORMAT_BADGE[item.format] && <div className="ig-tile-badge">{FORMAT_BADGE[item.format]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
