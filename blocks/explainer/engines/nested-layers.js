/**
 * Explainer engine "nested-layers": a system drawn as boxes inside boxes, the outermost first,
 * each box listing what that layer brings (the SLICC architecture figure of "SLICC on four
 * personal agents": Pi inside SLICC inside a browser tab). A switch closes the outer box, and
 * everything inside it goes with it.
 *
 * Rows, read by content:
 * - one row per layer, outermost first, two cells: the layer's name (a bold paragraph) and an
 *   optional note paragraph | a list of what the layer holds, each item a bold name and then a
 *   short note;
 * - reach: an optional one-cell row with a list, what the system reaches outside the outer box
 *   (each item a bold name, then how), under an optional label paragraph;
 * - close: an optional three-cell row: the switch's label while the outer box is open | its
 *   label while it is closed | the line shown in place of the inner layers;
 * - caption: the last one-cell row without a list.
 *
 * Behaviour: without JavaScript the layers read as their rows. The boxes build once from the
 * outside in when the figure scrolls into view, and again on replay (never under reduced
 * motion, where the finished drawing shows). Every authored element is moved into its box.
 *
 * @variants nested-layers
 * @ew-exempt the replay control's name ("Replay the build"), an icon button's aria-label
 */

const BEAT = 520;

export default async function engine(block, {
  slot, rows, onceVisible, reduceMotion, replayControl,
}) {
  const layerRows = [];
  let reach = null;
  let close = null;
  let caption = null;
  rows(block).forEach((cells) => {
    if (cells.length === 2 && cells[1].querySelector('ul, ol')) layerRows.push(cells);
    else if (cells.length === 3) close = cells;
    else if (cells.length === 1 && cells[0].querySelector('ul, ol')) [reach] = cells;
    else if (cells.length === 1) [caption] = cells;
  });
  if (!layerRows.length) return;

  const figure = document.createElement('figure');
  figure.className = 'nl';
  const stage = slot('nl-stage');
  const layers = layerRows.map(([nameCell, partsCell], depth) => {
    const list = partsCell.querySelector('ul, ol');
    const layer = slot('nl-layer', [slot('nl-name', [...nameCell.children]), slot('nl-parts', [list])]);
    layer.dataset.depth = Math.min(depth, 2);
    layer.append(...partsCell.children);
    return layer;
  });
  // each layer sits inside the one before it
  layers.forEach((layer, i) => (i ? layers[i - 1] : stage).append(layer));

  let timers = [];
  function build() {
    timers.forEach(clearTimeout);
    timers = [];
    if (reduceMotion()) return;
    figure.classList.add('is-building');
    layers.forEach((layer) => layer.removeAttribute('data-on'));
    layers.forEach((layer, i) => {
      timers.push(setTimeout(() => layer.setAttribute('data-on', ''), 200 + i * BEAT));
    });
    timers.push(setTimeout(() => figure.classList.remove('is-building'), 200 + layers.length * BEAT + 300));
  }

  const head = slot('nl-head');
  if (close && layers.length > 1) {
    const [openLabel, closedLabel, goneLine] = close;
    const labels = [slot('nl-label', [...openLabel.children]), slot('nl-label', [...closedLabel.children])];
    labels[1].hidden = true;
    const host = slot('nl-close ctl', labels);
    host.setAttribute('role', 'button');
    host.setAttribute('aria-pressed', 'false');
    host.tabIndex = 0;
    const gone = slot('nl-gone', [...goneLine.children]);
    gone.hidden = true;
    gone.setAttribute('aria-live', 'polite');
    layers[0].append(gone);
    const toggle = () => {
      const closed = host.getAttribute('aria-pressed') !== 'true';
      host.setAttribute('aria-pressed', String(closed));
      labels[0].hidden = closed;
      labels[1].hidden = !closed;
      stage.toggleAttribute('data-closed', closed);
      layers[1].inert = closed;
      gone.hidden = !closed;
    };
    host.addEventListener('click', toggle);
    host.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      toggle();
    });
    head.append(host);
  }
  head.append(replayControl('Replay the build', build));

  figure.append(head, stage);
  if (reach) figure.append(slot('nl-reach', [...reach.children]));
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'nl-caption';
    figcaption.append(...caption.children);
    figure.append(figcaption);
  }
  block.replaceChildren(figure);
  onceVisible(figure, build, 0.3);
}
