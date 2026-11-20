// Fixed scenes for screenshots: ?shot=cover shows the cover alone at full size;
// ?shot=editor shows the editor with a sample photo loaded. window.__shotReady
// is set once the scene has painted, so a screenshot tool can wait on it.
// Query params: photo, caption, subtitle, grade, layout, size, rain.
export async function runShot(shot, query, app) {
  const photo = query.get('photo') || 'rain-street';
  const caption = query.get('caption') || 'RAIN CITY';
  const subtitle = query.get('subtitle') || 'Vice Noir · 3 AM in the rain';
  const grade = query.get('grade') || 'rain';
  const layout = query.get('layout') || 'hero';
  const size = query.get('size') || '1080x1080';
  const rain = Number(query.get('rain') ?? '0.7');
  const layoutCells = { hero: 1, split: 2, triptych: 3, grid: 4 }[layout] || 1;

  if (shot === 'cover') document.body.classList.add('shot-cover');
  await app.loadSample(photo);
  const panels = [];
  for (let i = 0; i < layoutCells; i++) {
    panels.push({ photo, zoom: 1, panX: 0, panY: 0 });
  }
  app.setState({ size, layout, grade, caption, subtitle, rain, vignette: true, panels, selected: 0 });
  app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
