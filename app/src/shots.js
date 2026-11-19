// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the cover alone. Extra params: photo (a sample
// id), caption, layout, grade, w, h (cover canvas size). window.__shotReady is
// set once painted.
export async function runShot(shot, query, load, canvas) {
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  if (shot === 'editor') document.body.classList.add('shot-editor');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Match the canvas to the requested shot size so the capture is full-bleed.
    const w = Number(query.get('w') || 0);
    const h = Number(query.get('h') || 0);
    if (canvas && w >= 480 && h >= 480 && w <= 1920 && h <= 1920) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  await load(photo, caption);
  // Two frames so the canvas paint and the font have landed before the shot.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
}
