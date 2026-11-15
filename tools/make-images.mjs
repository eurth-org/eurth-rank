// Makes the pictures that aren't drawn by hand, with the Chrome on this machine: the favicon,
// the home-screen icons and the sharing image. Run it after changing the logo or the sharing
// image, and commit what it writes to public/:  npm run images
import { makeImages, sharingImage } from '@eurth/style/images';
import { createServer } from 'vite';
import { site } from '../eurth.config.mjs';

// The picture on the sharing image comes from the same code as the site (Vite reads TypeScript).
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { insigniaSvg } = await vite.ssrLoadModule('/src/rank/insignia.ts');
  const { templateById } = await vite.ssrLoadModule('/src/rank/templates.ts');
  const force = templateById('commonwealth').force;
  const pick = (branch, name) => insigniaSvg(force, branch, branch.ranks.find((r) => r.name === name), { idPrefix: name.replace(/\W/g, '') });
  const [army, navy] = force.branches;
  // A colonel's shoulder board, a sergeant's chevrons and a commander's rings, side by side.
  const art = `<div style="display:flex;align-items:center;justify-content:center;gap:28px;height:100%">${[pick(army, 'Colonel'), pick(army, 'Sergeant'), pick(navy, 'Commander')]
    .map((svg, i) => svg.replace('<svg ', `<svg style="height:${i === 0 ? 400 : 250}px;width:auto" `))
    .join('')}</div>`;
  const made = await makeImages({ sharing: [{ file: 'og.png', html: sharingImage({ site, art }) }] });
  console.log(`Made ${made.map((file) => `public/${file}`).join(', ')}`);
} finally {
  await vite.close();
}
