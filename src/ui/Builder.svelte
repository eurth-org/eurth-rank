<script lang="ts">
  /*
   * The builder: one Svelte component, hydrated on the start page.
   *   - the whole force lives in the link (?d=…), read safely on arrival and kept in step after;
   *   - nothing is stored: "save" is a link, a picture, a file or the nation's profile;
   *   - every change goes through src/rank/edit.ts, which gives back a new force, so undo is
   *     a list of the old ones;
   *   - every picture is drawn by src/rank and shown as an image, with its description as alt;
   *   - only tokens and eu- classes. Cloth and metal colours are the tool's subject, carried as data.
   */
  import { faArrowDown, faArrowUp, faCheck, faCopy, faDownload, faFileZipper, faMinus, faPlus, faRotateLeft, faSeedling, faTrashCan } from '@fortawesome/free-solid-svg-icons';
  import { createProfile, getSection, setNation as nameProfile, setSection, svgDataUrl, type EurthProfile } from '@eurth/profile';
  import ProfileButtons from '@eurth/profile/ProfileButtons.svelte';
  import { calm, copyText, download, fileSlug, PICTURE_SIZES, playTones, stateToLocation, svgToPicture, toast } from '@eurth/style';
  import Icon from '@eurth/style/components/Icon.svelte';
  import ShareButtons from '@eurth/style/components/ShareButtons.svelte';
  import { onMount } from 'svelte';
  import { ladderChart } from '../rank/chart';
  import { toCsv } from '../rank/csv';
  import { colourName, describeElement, describeInsignia, describeLadder, summarise, summariseLadder } from '../rank/describe';
  import { addBranch, addElement, addRank, branchPresets, moveElement, moveRank, removeBranch, removeElement, removeRank, setNation, startForce, updateBranch, updateElement, updateRank } from '../rank/edit';
  import { drawInsignia, insigniaSvg } from '../rank/insignia';
  import { encodeForce, forceFromSearch, forceLink, LINK_PARAM, LINK_VERSION, packForce } from '../rank/link';
  import {
    cloths,
    codes,
    elementKinds,
    elementNames,
    gradeNames,
    grades,
    MAX_ABBR,
    MAX_BRANCHES,
    MAX_ELEMENTS,
    MAX_NAME,
    MAX_NATION,
    MAX_RANKS,
    maxCount,
    metalColours,
    metalNames,
    metals,
    wearNames,
    wears,
    type Code,
    type Element,
    type ElementKind,
    type Force,
    type Grade,
    type Metal,
    type Wear,
  } from '../rank/model';
  import { paletteFor } from '../rank/palette';
  import { fromSection, toSection } from '../rank/profile';
  import { checkForce, EMU_TOAST, isEmuCommander, type Note } from '../rank/validate';
  import { fileName, fileStem, toWikitext } from '../rank/wikitext';
  import { zip } from '../rank/zip';

  // Passed in by the page: browser code never imports eurth.config.mjs (see the note there).
  let { siteName, siteUrl }: { siteName: string; siteUrl: string } = $props();

  const START = startForce();
  const START_CODE = encodeForce(START);
  const palette = paletteFor('dark');
  const dataUrl = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  let force = $state.raw<Force>(START);
  let past = $state.raw<Force[]>([]);
  let branchId = $state(START.branches[0]!.id);
  let rankId = $state(START.branches[0]!.ranks[5]!.id);
  let profile = $state.raw<EurthProfile | null>(null);
  let ready = $state(false);
  let preset = $state('marines');
  let size = $state('drawn');
  let spark = $state<{ x: number; y: number; key: number } | null>(null);

  const branch = $derived(force.branches.find((b) => b.id === branchId) ?? force.branches[0]);
  const rank = $derived(branch?.ranks.find((r) => r.id === rankId) ?? branch?.ranks[0]);

  // The nation's arms, or failing that its flag, from the profile: only ever shown as an image.
  const emblem = $derived(svgDataUrl(getSection(profile, 'arms')?.svg) || svgDataUrl(getSection(profile, 'flag')?.svg) || undefined);
  const flagColours = $derived(
    [...new Set((getSection(profile, 'flag')?.colours ?? []).filter((c): c is string => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)).map((c) => c.toLowerCase()))]
      .filter((c) => !cloths.some((known) => known.hex === c))
      .slice(0, 6),
  );

  const picture = $derived(branch && rank ? insigniaSvg(force, branch, rank, { emblem }) : '');
  const description = $derived(branch && rank ? describeInsignia(force, branch, rank) : '');
  const thumbs = $derived(new Map((branch?.ranks ?? []).map((r) => [r.id, dataUrl(insigniaSvg(force, branch!, r, { idPrefix: r.id }))])));
  const chart = $derived(branch ? ladderChart(force, branch, { palette, emblem }) : null);
  const notes = $derived(checkForce(force));

  // Before the page has loaded there is no address to read: the site's own, then.
  const base = $derived(ready ? `${location.origin}${location.pathname}` : `${siteUrl}/`);
  const untouched = $derived(encodeForce(force) === START_CODE);
  const link = $derived(untouched ? base : forceLink(force, base));
  const title = $derived(force.nation ? `The ranks of ${force.nation}` : 'A ladder of ranks');
  const slug = $derived(fileSlug(force.nation, 'ranks'));

  onMount(() => {
    // A link is someone else's input: forceFromSearch never throws, and cleans every value.
    const arrived = forceFromSearch(location.search);
    if (arrived?.branches.length) {
      force = arrived;
      choose(arrived.branches[0]!.id);
    } else if (new URLSearchParams(location.search).has(LINK_PARAM)) {
      toast('That link didn’t hold a ladder, so here is a fresh one.');
    }
    ready = true;
  });

  // The address bar follows the design, so the link can be copied from there too.
  $effect(() => {
    const state = untouched || link === null ? null : packForce(force);
    if (ready) stateToLocation(state, { version: LINK_VERSION });
  });

  // This tool's easter egg: the stars of a Supreme Emu Commander are emus.
  let emus = 0;
  $effect(() => {
    const count = force.branches.reduce((n, b) => n + b.ranks.filter((r) => isEmuCommander(r.name)).length, 0);
    if (ready && count > emus) toast(EMU_TOAST);
    emus = count;
  });

  // Typing a name is one change to undo, not one a letter.
  let lastKey = '';
  let lastAt = 0;
  function apply(next: Force, key = '') {
    const now = Date.now();
    if (!(key && key === lastKey && now - lastAt < 1500)) past = [...past.slice(-49), force];
    lastKey = key;
    lastAt = now;
    force = next;
  }

  function undo() {
    const last = past.at(-1);
    if (!last) return;
    past = past.slice(0, -1);
    lastKey = '';
    force = last;
    toast('Undone.');
  }

  function startAgain() {
    apply(START);
    choose(START.branches[0]!.id);
    toast('A fresh ladder.');
  }

  /** Shows a branch, and one of its ranks: the sixth from the top, a colonel in the usual ladder. */
  function choose(id: string, pick?: string) {
    const found = force.branches.find((b) => b.id === id);
    branchId = id;
    rankId = pick ?? found?.ranks[Math.min(5, found.ranks.length - 1)]?.id ?? '';
  }

  function newBranch() {
    const added = addBranch(force, preset);
    if (!added.id) return toast(`A force can have ${MAX_BRANCHES} branches, and this one has them all.`);
    apply(added.force);
    choose(added.id);
  }

  function dropBranch() {
    if (!branch) return;
    const name = branch.name;
    apply(removeBranch(force, branch.id));
    choose(force.branches[0]?.id ?? '');
    toast(`${name} is gone. Undo brings it back.`);
  }

  function newRank() {
    if (!branch) return;
    const added = addRank(force, branch.id, rank?.id);
    if (!added.id) return toast(`A branch can have ${MAX_RANKS} ranks, and this one has them all.`);
    apply(added.force);
    rankId = added.id;
  }

  function dropRank(id: string) {
    if (!branch) return;
    const at = branch.ranks.findIndex((r) => r.id === id);
    apply(removeRank(force, branch.id, id));
    if (id === rankId) rankId = branch.ranks[at + 1]?.id ?? branch.ranks[at - 1]?.id ?? '';
  }

  // The signature touch: a new device snaps on with a tiny glint, and a click once sound is on.
  function glint(next: Force, element?: number) {
    const b = next.branches.find((x) => x.id === branch?.id);
    const r = b?.ranks.find((x) => x.id === rank?.id);
    if (!b || !r) return;
    const drawn = drawInsignia(b, r);
    const centre = element === undefined ? drawn.centres.at(-1) : drawn.centres.findLast((c) => c.element === element);
    if (centre && !calm()) spark = { x: (centre.x / drawn.width) * 100, y: (centre.y / drawn.height) * 100, key: Date.now() };
    playTones([[1976, 0, 0.03], [2960, 0.035, 0.018]], { length: 0.12 });
  }

  function add(kind: ElementKind) {
    if (!branch || !rank) return;
    const next = addElement(force, branch.id, rank.id, kind);
    apply(next);
    glint(next);
  }

  function count(index: number, element: Element, by: -1 | 1) {
    if (!branch || !rank) return;
    const next = updateElement(force, branch.id, rank.id, index, { count: element.count + by });
    apply(next);
    if (by > 0) glint(next, index);
  }

  const edit = (index: number, changes: Partial<Omit<Element, 'kind'>>) => branch && rank && apply(updateElement(force, branch.id, rank.id, index, changes));
  const canAdd = (kind: ElementKind): boolean => {
    if (!rank) return false;
    const last = rank.elements.at(-1);
    return rank.elements.length < MAX_ELEMENTS || (last?.kind === kind && !last.wide && last.count < maxCount[kind]);
  };

  function loaded(next: EurthProfile) {
    profile = next;
    const nation = next.meta.nation;
    // Read what other tools wrote; never change their sections.
    const theirs = fromSection(getSection(next, 'rank'), nation);
    if (theirs?.branches.length) {
      apply(theirs);
      choose(theirs.branches[0]!.id);
      toast(`${nation || 'Your nation'}’s ranks are loaded.`);
    } else {
      if (nation && !force.nation) apply(setNation(force, nation));
      toast(`${nation || 'Your nation'} is loaded. It has no ranks yet, so these stay as they are.`);
    }
  }

  // What "Save profile" writes: the rank section, and nothing else. A new file gets only the nation's name.
  const saved = $derived.by(() => {
    const file = force.nation ? nameProfile(profile ?? createProfile(force.nation), force.nation) : profile;
    return file ? setSection(file, 'rank', toSection(force, { base: `${siteUrl}/`, previous: getSection(file, 'rank') })) : null;
  });

  const sizes = [{ id: 'drawn', name: 'As drawn', width: 0, height: 0 }, ...PICTURE_SIZES];

  async function saveInsignia(type?: 'image/png' | 'image/webp') {
    if (!branch || !rank) return;
    const stem = fileStem(force, branch, rank);
    if (!type) return download(picture, `${stem}.svg`, 'image/svg+xml');
    const drawn = drawInsignia(branch, rank);
    download(await svgToPicture(picture, { width: drawn.width * 4, height: drawn.height * 4, type }), `${stem}.${type === 'image/png' ? 'png' : 'webp'}`);
  }

  async function saveChart(type?: 'image/png' | 'image/webp') {
    if (!branch || !chart) return;
    const stem = `${slug}-${fileSlug(branch.name, 'branch')}-ranks`;
    if (!type) return download(chart.svg, `${stem}.svg`, 'image/svg+xml');
    const chosen = sizes.find((s) => s.id === size);
    const [width, height] = chosen?.width ? [chosen.width, chosen.height] : [chart.width * 2, chart.height * 2];
    download(await svgToPicture(chart.svg, { width, height, type, background: palette.surface, fit: 'contain' }), `${stem}${chosen?.width ? `-${chosen.id}` : ''}.${type === 'image/png' ? 'png' : 'webp'}`);
  }

  // Every insignia at once, each under the file name the wiki table points at.
  function saveAll() {
    const files = force.branches.flatMap((b) => b.ranks.map((r) => ({ name: fileName(force, b, r), text: insigniaSvg(force, b, r, { emblem }) })));
    download(new Blob([zip(files) as BlobPart], { type: 'application/zip' }), `${slug}-insignia.zip`);
    toast(`${files.length} insignia, zipped.`);
  }

  async function copyWiki() {
    toast((await copyText(toWikitext(force))) ? 'Wikitext copied: a table a branch.' : 'That didn’t copy. Your browser may not allow it here.');
  }

  function show(note: Note) {
    choose(note.branch, note.ranks[0]);
  }

  const flags: { key: 'wide' | 'down' | 'curl'; label: string; kinds: ElementKind[] }[] = [
    { key: 'wide', label: 'Wide', kinds: ['bar', 'ring'] },
    { key: 'down', label: 'Point down', kinds: ['chevron'] },
    { key: 'curl', label: 'Curl on top', kinds: ['ring'] },
  ];
  const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
</script>

<div class="builder">
  <form class="eu-card top" onsubmit={(e) => e.preventDefault()}>
    <label class="eu-field nation">
      <span class="eu-label">Nation</span>
      <input class="eu-input" value={force.nation} maxlength={MAX_NATION} autocomplete="off" placeholder="Your nation" oninput={(e) => apply(setNation(force, e.currentTarget.value), 'nation')} />
    </label>
    <div class="eu-row">
      <button type="button" class="eu-btn" data-click="spin" onclick={undo} disabled={!past.length}><Icon icon={faRotateLeft} /> Undo</button>
      <button type="button" class="eu-btn" data-click="bounce" onclick={startAgain}><Icon icon={faSeedling} /> Start again</button>
    </div>
  </form>

  <section class="branches" aria-labelledby="branches-title">
    <h2 id="branches-title" class="eu-label">Branches</h2>
    <div class="eu-row">
      {#each force.branches as b (b.id)}
        <button type="button" class="eu-btn" aria-pressed={b.id === branch?.id} onclick={() => choose(b.id)}>
          <span class="eu-swatch" style:--swatch={b.cloth}></span>
          {b.name}
        </button>
      {/each}
    </div>
    <div class="eu-row">
      <label class="eu-field add">
        <span class="eu-visually-hidden">A branch to add</span>
        <select class="eu-select" bind:value={preset}>
          {#each branchPresets as p (p.id)}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
      </label>
      <button type="button" class="eu-btn" onclick={newBranch} disabled={force.branches.length >= MAX_BRANCHES}><Icon icon={faPlus} /> Add branch</button>
    </div>
  </section>

  {#if branch}
    <div class="work">
      <section class="eu-card ladder" aria-labelledby="ladder-title">
        <h2 id="ladder-title">{branch.name}: the ladder</h2>

        <div class="settings">
          <label class="eu-field">
            <span class="eu-label">Branch name</span>
            <input class="eu-input" value={branch.name} maxlength={MAX_NAME} autocomplete="off" oninput={(e) => apply(updateBranch(force, branch.id, { name: e.currentTarget.value }), `branch-${branch.id}`)} />
          </label>
          <label class="eu-field">
            <span class="eu-label">Piping</span>
            <select class="eu-select" value={branch.piping} onchange={(e) => apply(updateBranch(force, branch.id, { piping: e.currentTarget.value }))}>
              <option value="">None</option>
              <option value={metalColours.gold}>Gold</option>
              {#each cloths as c (c.hex)}
                <option value={c.hex}>{capital(c.name)}</option>
              {/each}
              {#if branch.piping && branch.piping !== metalColours.gold && !cloths.some((c) => c.hex === branch.piping)}
                <option value={branch.piping}>{capital(colourName(branch.piping))} ({branch.piping})</option>
              {/if}
            </select>
          </label>
          <fieldset class="group">
            <legend class="eu-label">Cloth: {colourName(branch.cloth)}</legend>
            <div class="swatches">
              {#each [...cloths.map((c) => ({ ...c, from: '' })), ...flagColours.map((hex) => ({ hex, name: colourName(hex), from: ', from your flag' }))] as c (c.hex)}
                <button
                  type="button"
                  class="eu-btn eu-btn--icon"
                  aria-pressed={branch.cloth === c.hex}
                  aria-label={`${capital(c.name)}${c.from}`}
                  data-tip={`${capital(c.name)}${c.from}`}
                  onclick={() => apply(updateBranch(force, branch.id, { cloth: c.hex }))}
                >
                  <span class="eu-swatch big" style:--swatch={c.hex}></span>
                </button>
              {/each}
            </div>
          </fieldset>
          <fieldset class="group">
            <legend class="eu-label">Metal</legend>
            <div class="eu-row">
              {#each metals as m (m)}
                <label class="eu-pill">
                  <input type="radio" name="metal" value={m} checked={branch.metal === m} onchange={() => apply(updateBranch(force, branch.id, { metal: m as Metal }))} />
                  <span class="eu-check"><Icon icon={faCheck} /></span>
                  {capital(metalNames[m])}
                </label>
              {/each}
            </div>
          </fieldset>
        </div>

        <div class="head" aria-hidden="true">
          <span></span>
          <span class="eu-label">NATO code</span>
          <span class="eu-label">Rank</span>
          <span class="eu-label">Short</span>
          <span></span>
        </div>
        <ol class="ranks">
          {#each branch.ranks as r, i (r.id)}
            {@const label = r.name || `rank ${i + 1}`}
            <li class:chosen={r.id === rank?.id}>
              <button type="button" class="eu-btn pick" aria-pressed={r.id === rank?.id} aria-label={`Edit the insignia of ${label}`} data-tip="Edit the insignia" data-tip-align="start" onclick={() => (rankId = r.id)}>
                <img src={thumbs.get(r.id)} alt="" width="28" height="40" />
              </button>
              <select class="eu-select eu-input--data" aria-label={`NATO code of ${label}`} value={r.code} onchange={(e) => apply(updateRank(force, branch.id, r.id, { code: e.currentTarget.value as Code | '' }))}>
                <option value="">None</option>
                {#each codes as code (code)}
                  <option value={code}>{code}</option>
                {/each}
              </select>
              <input
                class="eu-input"
                aria-label={`Name of rank ${i + 1}`}
                value={r.name}
                maxlength={MAX_NAME}
                autocomplete="off"
                placeholder="Rank"
                onfocus={() => (rankId = r.id)}
                oninput={(e) => apply(updateRank(force, branch.id, r.id, { name: e.currentTarget.value }), `name-${r.id}`)}
              />
              <input
                class="eu-input eu-input--data"
                aria-label={`Abbreviation of ${label}`}
                value={r.abbr}
                maxlength={MAX_ABBR}
                autocomplete="off"
                placeholder="Abbr"
                onfocus={() => (rankId = r.id)}
                oninput={(e) => apply(updateRank(force, branch.id, r.id, { abbr: e.currentTarget.value }), `abbr-${r.id}`)}
              />
              <span class="moves">
                <button type="button" class="eu-btn eu-btn--icon eu-btn--quiet" aria-label={`Move ${label} up`} data-tip="Move up" disabled={i === 0} onclick={() => apply(moveRank(force, branch.id, r.id, -1))}><Icon icon={faArrowUp} /></button>
                <button type="button" class="eu-btn eu-btn--icon eu-btn--quiet" aria-label={`Move ${label} down`} data-tip="Move down" disabled={i === branch.ranks.length - 1} onclick={() => apply(moveRank(force, branch.id, r.id, 1))}><Icon icon={faArrowDown} /></button>
                <button type="button" class="eu-btn eu-btn--icon eu-btn--quiet" aria-label={`Remove ${label}`} data-tip="Remove" data-tip-align="end" onclick={() => dropRank(r.id)}><Icon icon={faTrashCan} /></button>
              </span>
            </li>
          {/each}
        </ol>
        {#if !branch.ranks.length}
          <p class="eu-muted">No ranks yet. Add the first.</p>
        {/if}
        <div class="eu-row">
          <button type="button" class="eu-btn" onclick={newRank} disabled={branch.ranks.length >= MAX_RANKS}><Icon icon={faPlus} /> Add rank{rank ? ` below ${rank.name || 'this one'}` : ''}</button>
          <button type="button" class="eu-btn eu-btn--quiet" onclick={dropBranch}><Icon icon={faTrashCan} /> Remove {branch.name}</button>
        </div>
      </section>

      <section class="eu-card insignia" aria-labelledby="insignia-title">
        {#if rank}
          <h2 id="insignia-title">{rank.name || 'Unnamed rank'}{rank.code ? `, ${rank.code}` : ''}</h2>
          <div class="stage">
            <div class="art">
              <img src={dataUrl(picture)} alt={description} width="140" height="320" class={rank.wear} />
              {#if spark}
                {#key spark.key}
                  <span class="spark" style:left="{spark.x}%" style:top="{spark.y}%" onanimationend={() => (spark = null)} aria-hidden="true">
                    <svg viewBox="-12 -12 24 24" width="36" height="36"><path d="M0 -11L2.4 -2.4L11 0L2.4 2.4L0 11L-2.4 2.4L-11 0L-2.4 -2.4Z" /></svg>
                  </span>
                {/key}
              {/if}
            </div>
          </div>
          <p class="eu-muted" aria-hidden="true">{description}</p>

          <fieldset class="group">
            <legend class="eu-label">Worn on</legend>
            <div class="eu-row">
              {#each wears as w (w)}
                <label class="eu-pill">
                  <input type="radio" name="wear" value={w} checked={rank.wear === w} onchange={() => apply(updateRank(force, branch.id, rank.id, { wear: w as Wear }))} />
                  <span class="eu-check"><Icon icon={faCheck} /></span>
                  {wearNames[w]}
                </label>
              {/each}
            </div>
          </fieldset>

          <label class="eu-field">
            <span class="eu-label">Grade</span>
            <select class="eu-select" value={rank.grade} onchange={(e) => apply(updateRank(force, branch.id, rank.id, { grade: e.currentTarget.value as Grade }))}>
              {#each grades as g (g)}
                <option value={g}>{gradeNames[g]}</option>
              {/each}
            </select>
          </label>

          <div class="group">
            <h3 class="eu-label">On it, from the collar end</h3>
            {#if rank.elements.length}
              <ol class="elements">
                {#each rank.elements as element, i (i)}
                  {@const [one, many] = elementNames[element.kind]}
                  <li>
                    <span class="what">{capital(describeElement(element, isEmuCommander(rank.name)))}</span>
                    <span class="controls">
                      <button type="button" class="eu-btn eu-btn--icon" aria-label={`One ${one} fewer`} data-tip="One fewer" disabled={element.count <= 1} onclick={() => count(i, element, -1)}><Icon icon={faMinus} /></button>
                      <output class="eu-data" aria-label={`${element.count} ${element.count === 1 ? one : many}`}>{element.count}</output>
                      <button type="button" class="eu-btn eu-btn--icon" aria-label={`One ${one} more`} data-tip="One more" disabled={element.count >= maxCount[element.kind]} onclick={() => count(i, element, 1)}><Icon icon={faPlus} /></button>
                      {#each flags.filter((f) => f.kinds.includes(element.kind)) as flag (flag.key)}
                        <label class="eu-pill">
                          <input type="checkbox" checked={element[flag.key] === true} onchange={(e) => edit(i, { [flag.key]: e.currentTarget.checked })} />
                          <span class="eu-check"><Icon icon={faCheck} /></span>
                          {flag.label}
                        </label>
                      {/each}
                      <button type="button" class="eu-btn eu-btn--icon eu-btn--quiet" aria-label={`Move the ${many} up`} data-tip="Move up" disabled={i === 0} onclick={() => apply(moveElement(force, branch.id, rank.id, i, -1))}><Icon icon={faArrowUp} /></button>
                      <button type="button" class="eu-btn eu-btn--icon eu-btn--quiet" aria-label={`Move the ${many} down`} data-tip="Move down" disabled={i === rank.elements.length - 1} onclick={() => apply(moveElement(force, branch.id, rank.id, i, 1))}><Icon icon={faArrowDown} /></button>
                      <button type="button" class="eu-btn eu-btn--icon eu-btn--quiet" aria-label={`Remove the ${many}`} data-tip="Remove" data-tip-align="end" onclick={() => apply(removeElement(force, branch.id, rank.id, i))}><Icon icon={faTrashCan} /></button>
                    </span>
                  </li>
                {/each}
              </ol>
            {:else}
              <p class="eu-muted">Nothing yet: a plain {wearNames[rank.wear].toLowerCase()}. Add something below.</p>
            {/if}
          </div>

          <div class="group">
            <h3 class="eu-label">Add</h3>
            <div class="eu-row">
              {#each elementKinds as kind (kind)}
                <button type="button" class="eu-btn" onclick={() => add(kind)} disabled={!canAdd(kind)}><Icon icon={faPlus} /> {capital(elementNames[kind][0])}</button>
              {/each}
            </div>
            <p class="eu-help">
              {emblem ? 'The emblem is the arms or flag from your profile.' : 'The emblem is a plain disc until you load a profile with arms or a flag.'}
            </p>
          </div>

          <div class="group">
            <h3 class="eu-label">This insignia</h3>
            <div class="eu-row">
              <button type="button" class="eu-btn" data-click="bounce" onclick={() => saveInsignia()}><Icon icon={faDownload} /> SVG</button>
              <button type="button" class="eu-btn" data-click="bounce" onclick={() => saveInsignia('image/png')}><Icon icon={faDownload} /> PNG</button>
              <button type="button" class="eu-btn" data-click="bounce" onclick={() => saveInsignia('image/webp')}><Icon icon={faDownload} /> WebP</button>
            </div>
          </div>
        {:else}
          <h2 id="insignia-title">Insignia</h2>
          <p class="eu-muted">Add a rank to give it an insignia.</p>
        {/if}
      </section>
    </div>

    <section class="result" aria-labelledby="chart-title">
      <h2 id="chart-title">{branch.name}: the ladder chart</h2>
      {#if chart}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div class="eu-scroll chart" tabindex="0" role="group" aria-label="The ladder chart. It scrolls sideways on a small screen.">
          <img src={dataUrl(chart.svg)} alt={summariseLadder(force, branch)} width={chart.width} height={chart.height} />
        </div>
      {/if}

      <div class="eu-row">
        <label class="eu-field size">
          <span class="eu-visually-hidden">Size of the PNG or WebP</span>
          <select class="eu-select" bind:value={size}>
            {#each sizes as s (s.id)}
              <option value={s.id}>{s.name}{s.width ? `, ${s.width} × ${s.height}` : ''}</option>
            {/each}
          </select>
        </label>
        <button type="button" class="eu-btn" data-click="bounce" onclick={() => saveChart()}><Icon icon={faDownload} /> Chart SVG</button>
        <button type="button" class="eu-btn" data-click="bounce" onclick={() => saveChart('image/png')}><Icon icon={faDownload} /> Chart PNG</button>
        <button type="button" class="eu-btn" data-click="bounce" onclick={() => saveChart('image/webp')}><Icon icon={faDownload} /> Chart WebP</button>
      </div>

      <ShareButtons
        url={link ?? base}
        {title}
        text={`${summarise(force)} Made with ${siteName}.`}
        description={() => describeLadder(force, branch)}
        picture={() => svgToPicture(chart?.svg ?? '', { width: 1200, height: 630, background: palette.surface, fit: 'contain' })}
        heading={force.nation ? `Share the ranks of ${force.nation}` : 'Share your ranks'}
        said={{ link: link === null ? 'Link copied, but this force is too big to fit in it. Save the profile to keep it.' : 'Link copied: the whole force is in it.', description: 'Description copied: the ladder, a line a rank.' }}
      />

      <div class="eu-row">
        <button type="button" class="eu-btn" data-click="bounce" onclick={copyWiki}><Icon icon={faCopy} /> Copy wikitext</button>
        <button type="button" class="eu-btn" data-click="bounce" onclick={saveAll}><Icon icon={faFileZipper} /> Every insignia (.zip)</button>
        <button type="button" class="eu-btn" data-click="bounce" onclick={() => download(toCsv(force), `${slug}-ranks.csv`, 'text/csv')}><Icon icon={faDownload} /> CSV</button>
        <ProfileButtons profile={saved} onload={loaded} onerror={(errors) => toast(errors[0]?.message ?? 'That file isn’t a nation profile. Pick one that ends in .eurth.json.')} />
      </div>
      <p class="eu-help">
        {#if link === null}
          This force is too big for a link. Save the profile to keep it: the file holds everything.
        {:else}
          The link holds the whole force.
        {/if}
        The wikitext names a file for each insignia, and the zip holds exactly those files, so uploading them fills the table in. {force.nation ? '' : 'Name your nation to save its profile. '}Nothing
        is kept in this browser.
      </p>

      {#if notes.length}
        <div class="notes">
          <h3 class="eu-label">Worth a look</h3>
          <ul>
            {#each notes as note (note.code + note.branch + note.ranks.join())}
              <li>
                <button type="button" class="eu-btn eu-btn--quiet" onclick={() => show(note)}>{note.kind === 'problem' ? 'Check: ' : 'Tip: '}{note.text}</button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>
  {:else}
    <p class="eu-muted">No branches yet. Add one above, or start again.</p>
  {/if}
</div>

<style>
  .builder {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  h2 {
    font: var(--type-subtitle);
  }

  h2.eu-label,
  h3.eu-label {
    font: var(--type-label);
  }

  .top {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .nation {
    flex: 1 1 260px;
    max-width: 420px;
  }

  .branches {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .add,
  .size {
    min-width: 200px;
  }

  .work {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    gap: var(--space-5);
    align-items: start;
  }

  .ladder,
  .insignia {
    gap: var(--space-4);
  }

  .settings {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
  }

  .settings fieldset {
    grid-column: 1 / -1;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .eu-swatch.big {
    width: var(--space-6);
    height: var(--space-6);
  }

  .head,
  .ranks li {
    display: grid;
    grid-template-columns: var(--size-target) 104px minmax(0, 1fr) 96px auto;
    gap: var(--space-2);
    align-items: center;
  }

  .head span:last-child {
    width: calc(var(--size-target) * 3);
  }

  .ranks,
  .elements,
  .notes ul {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ranks li.chosen {
    border-radius: var(--radius-md);
    outline: 2px solid var(--line-strong);
    outline-offset: 2px;
  }

  .pick {
    width: var(--size-target);
    min-width: var(--size-target);
    padding: 0;
    justify-content: center;
  }

  .pick img {
    display: block;
    width: auto;
    height: 36px;
    max-width: 36px;
    object-fit: contain;
  }

  .moves {
    display: flex;
  }

  .stage {
    display: flex;
    justify-content: center;
    padding: var(--space-4);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .art {
    position: relative;
    line-height: 0;
  }

  .art img {
    display: block;
    width: auto;
    height: 300px;
    max-width: 100%;
  }

  .art img.sleeve {
    height: 240px;
  }

  .art img.collar {
    height: 150px;
  }

  .spark {
    position: absolute;
    width: 36px;
    height: 36px;
    margin: -18px 0 0 -18px;
    pointer-events: none;
    animation: glint 0.45s ease-out forwards;
  }

  .spark path {
    fill: var(--parchment);
    stroke: var(--night);
    stroke-width: 0.6;
  }

  @keyframes glint {
    0% {
      opacity: 0;
      transform: scale(0.2) rotate(0deg);
    }

    35% {
      opacity: 1;
      transform: scale(1.3) rotate(40deg);
    }

    100% {
      opacity: 0;
      transform: scale(0.3) rotate(90deg);
    }
  }

  .elements li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding-top: var(--space-2);
    border-top: 1px solid var(--line);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .controls output {
    min-width: var(--space-5);
    text-align: center;
  }

  .result {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 0;
  }

  .chart {
    border-radius: var(--radius-md);
  }

  .chart img {
    display: block;
    width: 100%;
    min-width: 720px;
    height: auto;
    border-radius: var(--radius-md);
  }

  .notes {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .notes .eu-btn {
    height: auto;
    min-height: var(--size-target);
    padding-block: var(--space-2);
    text-align: start;
    white-space: normal;
  }

  @media (max-width: 960px) {
    .work {
      grid-template-columns: minmax(0, 1fr);
    }

    /* On a small screen the insignia comes first: it is what the visitor came for. */
    .insignia {
      order: -1;
    }
  }

  @media (max-width: 560px) {
    .settings {
      grid-template-columns: minmax(0, 1fr);
    }

    .head {
      display: none;
    }

    .ranks li {
      grid-template-columns: var(--size-target) minmax(0, 1fr) 96px;
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--line);
    }

    .ranks li > .eu-input:not(.eu-input--data) {
      grid-column: 2 / -1;
      grid-row: 1;
    }

    .ranks li > .pick {
      grid-row: 1;
    }

    .ranks li > select {
      grid-column: 1 / 3;
    }

    .moves {
      grid-column: 1 / -1;
      justify-content: flex-end;
    }
  }
</style>
