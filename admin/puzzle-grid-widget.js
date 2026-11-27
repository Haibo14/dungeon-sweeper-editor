// Custom Sveltia CMS field type "puzzle-grid" for the "rows" of a puzzle
// (data/puzzles/<id>.json of the game repository, docs/data/format-mystery.md).
// A clickable grid instead of lines of text; the stored value is unchanged: a
// list of strings, one character per cell ("*" mine, "#" hidden safe cell,
// "." revealed cell). The checks mirror PuzzleData.get_errors() and
// PuzzleSolver.count_solutions() of the game: keep them in step.
(function () {
  "use strict";

  const MINE = "*";
  const HIDDEN = "#";
  const REVEALED = ".";
  // PuzzleData.MAX_SIZE.
  const MAX_SIZE = 5;
  const DEFAULT_SIZE = 4;
  // Click order of a cell.
  const NEXT = { [REVEALED]: HIDDEN, [HIDDEN]: MINE, [MINE]: REVEALED };

  // --- Pure logic (no DOM), also used by the tests in the browser console. ---

  // The value as a plain list of strings, whatever Sveltia hands over.
  function toRows(value) {
    if (value && typeof value.toJS === "function") value = value.toJS();
    if (!Array.isArray(value)) return [];
    return value.map((row) => (typeof row === "string" ? row : String(row ?? "")));
  }

  function makeRows(width, height, fill) {
    return Array.from({ length: height }, () => (fill ?? REVEALED).repeat(width));
  }

  // The rows resized to width x height, keeping the cells that still fit.
  function resize(rows, width, height) {
    const result = [];
    for (let y = 0; y < height; y++) {
      let row = "";
      for (let x = 0; x < width; x++) {
        const cell = rows[y]?.[x];
        row += cell === MINE || cell === HIDDEN || cell === REVEALED ? cell : REVEALED;
      }
      result.push(row);
    }
    return result;
  }

  function setCell(rows, x, y, cell) {
    return rows.map((row, index) => (index === y ? row.slice(0, x) + cell + row.slice(x + 1) : row));
  }

  function cells(rows, character) {
    const found = [];
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === character) found.push([x, y]);
    });
    return found;
  }

  function isNeighbor(a, b) {
    return Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && (a[0] !== b[0] || a[1] !== b[1]);
  }

  // PuzzleData.get_number(): the mines around a cell.
  function numberAt(rows, x, y) {
    return cells(rows, MINE).filter((mine) => isNeighbor(mine, [x, y])).length;
  }

  // PuzzleSolver.choose(): the ways to choose k among n, at most cap.
  function choose(n, k, cap) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let result = 1;
    for (let i = 0; i < k; i++) {
      result = (result * (n - i)) / (i + 1);
      if (result >= cap) return cap;
    }
    return result;
  }

  // PuzzleSolver.count_solutions(): the layouts of the known number of mines
  // among the hidden cells that give each revealed cell its number, up to limit.
  // Backtracking over the cells next to a number; the others are only counted.
  function countSolutions(rows, limit) {
    limit = limit ?? 2;
    const hidden = cells(rows, MINE).concat(cells(rows, HIDDEN));
    const numberCells = cells(rows, REVEALED);
    const needed = numberCells.map((cell) => numberAt(rows, cell[0], cell[1]));
    const open = numberCells.map(() => 0);
    const touches = [];
    let freeCells = 0;
    hidden.sort((a, b) => a[1] - b[1] || a[0] - b[0]).forEach((cell) => {
      const touched = [];
      numberCells.forEach((number, index) => {
        if (isNeighbor(number, cell)) {
          touched.push(index);
          open[index]++;
        }
      });
      if (touched.length) touches.push(touched);
      else freeCells++;
    });
    if (needed.some((target, index) => target > open[index])) return 0;
    let minesLeft = cells(rows, MINE).length;
    let found = 0;
    function run(position) {
      if (position === touches.length) {
        found = Math.min(limit, found + choose(freeCells, minesLeft, limit - found));
        return;
      }
      const cellsAfter = touches.length - position - 1 + freeCells;
      for (const mine of [1, 0]) {
        if (found >= limit) return;
        if (mine && minesLeft === 0) continue;
        let fits = minesLeft - mine <= cellsAfter;
        for (const index of touches[position]) {
          open[index]--;
          needed[index] -= mine;
          if (needed[index] < 0 || needed[index] > open[index]) fits = false;
        }
        minesLeft -= mine;
        if (fits) run(position + 1);
        minesLeft += mine;
        for (const index of touches[position]) {
          open[index]++;
          needed[index] += mine;
        }
      }
    }
    run(0);
    return found;
  }

  // PuzzleData.get_errors(), in French for the editor; empty when playable.
  function getErrors(rows) {
    if (rows.length === 0) return ["Aucune ligne."];
    const width = rows[0].length;
    const errors = [];
    if (width === 0) errors.push("Ligne vide.");
    if (width > MAX_SIZE || rows.length > MAX_SIZE) errors.push(`Plus grand que ${MAX_SIZE} × ${MAX_SIZE}.`);
    rows.forEach((row, y) => {
      if (row.length !== width) errors.push(`Ligne ${y + 1} : ${row.length} cases au lieu de ${width}.`);
      if (/[^*#.]/.test(row)) errors.push(`Ligne ${y + 1} : caractère inconnu.`);
    });
    if (errors.length) return errors;
    if (cells(rows, MINE).length === 0) errors.push("Aucune mine.");
    if (cells(rows, REVEALED).length === 0) errors.push("Aucune case révélée.");
    if (errors.length) return errors;
    const solutions = countSolutions(rows);
    if (solutions === 0) errors.push("Aucune solution.");
    else if (solutions > 1) errors.push("Plusieurs solutions : le joueur devrait deviner.");
    return errors;
  }

  window.PuzzleGrid = { MINE, HIDDEN, REVEALED, MAX_SIZE, toRows, makeRows, resize, setCell, numberAt, choose, countSolutions, getErrors };

  // --- Field type ---

  const CMS = window.CMS;
  if (!CMS || typeof CMS.registerWidget !== "function" || !CMS.React) return;
  const React = CMS.React;
  const h = React.createElement;

  const CELL_STYLE = {
    width: "44px", height: "44px", margin: 0, padding: 0, border: "1px solid #555",
    borderRadius: "4px", font: "bold 20px/1 monospace", cursor: "pointer",
  };
  const LOOKS = {
    [REVEALED]: { background: "#e8e4d8", color: "#222" },
    [HIDDEN]: { background: "#4a5568", color: "#fff" },
    [MINE]: { background: "#b83232", color: "#fff" },
  };
  const NAMES = { [REVEALED]: "révélée", [HIDDEN]: "cachée", [MINE]: "mine" };
  const NUMBER_COLORS = ["", "#1f4fd1", "#1a7f2a", "#c62828", "#4a148c", "#7f1d1d", "#00838f", "#222", "#555"];

  function cellLabel(rows, x, y) {
    const cell = rows[y][x];
    if (cell === MINE) return "✸";
    if (cell === HIDDEN) return "";
    const number = numberAt(rows, x, y);
    return number ? String(number) : "";
  }

  function Grid({ rows, onCell, readOnly }) {
    return h("div", { style: { display: "inline-grid", gap: "3px", gridTemplateColumns: `repeat(${rows[0]?.length ?? 0}, 44px)` } },
      rows.flatMap((row, y) => Array.from(row, (cell, x) => {
        const look = LOOKS[cell] ?? LOOKS[REVEALED];
        const number = cell === REVEALED ? numberAt(rows, x, y) : 0;
        return h("button", {
          key: `${x},${y}`,
          type: "button",
          disabled: readOnly,
          "aria-label": `Case ${x + 1}, ${y + 1} : ${NAMES[cell] ?? cell}`,
          title: "Clic : révélée → cachée → mine",
          onClick: onCell ? () => onCell(x, y) : undefined,
          style: { ...CELL_STYLE, ...look, color: number ? NUMBER_COLORS[number] : look.color, cursor: readOnly ? "default" : "pointer" },
        }, cellLabel(rows, x, y));
      })));
  }

  function SizeInput({ label, value, onChange, id, readOnly }) {
    return h("label", { style: { marginRight: "12px" } }, `${label} `,
      h("input", {
        id, type: "number", min: 1, max: MAX_SIZE, step: 1, value, disabled: readOnly,
        style: { width: "4em" },
        onChange: (event) => {
          // Ignore an empty or partial input: resizing would drop cells.
          const size = parseInt(event.target.value, 10);
          if (size >= 1 && size <= MAX_SIZE) onChange(size);
        },
      }));
  }

  function Status({ rows }) {
    const errors = getErrors(rows);
    const mines = cells(rows, MINE).length;
    const ok = errors.length === 0;
    return h("div", { role: "status", style: { marginTop: "8px", color: ok ? "#1a7f2a" : "#b83232" } },
      `${mines} mine${mines > 1 ? "s" : ""} · `,
      ok ? "Solution unique ✓" : errors.join(" "));
  }

  function Control(props) {
    const { value, onChange, forID } = props;
    const readOnly = !!props.readonly;
    const rows = toRows(value);
    const empty = rows.length === 0;
    React.useEffect(() => {
      if (empty && !readOnly) onChange(makeRows(DEFAULT_SIZE, DEFAULT_SIZE));
    }, [empty]);
    if (empty) return h("div", null, "…");
    const width = rows[0].length;
    const height = rows.length;
    return h("div", { style: { padding: "4px 0" } },
      h("div", { style: { marginBottom: "8px" } },
        h(SizeInput, { label: "Largeur", value: width, id: forID, readOnly, onChange: (w) => onChange(resize(rows, w, height)) }),
        h(SizeInput, { label: "Hauteur", value: height, readOnly, onChange: (hh) => onChange(resize(rows, width, hh)) })),
      h(Grid, { rows, readOnly, onCell: (x, y) => onChange(setCell(rows, x, y, NEXT[rows[y][x]] ?? REVEALED)) }),
      h(Status, { rows }));
  }

  function Preview({ value }) {
    const rows = toRows(value);
    if (rows.length === 0) return null;
    return h("div", null, h(Grid, { rows, readOnly: true }), h(Status, { rows }));
  }

  CMS.registerWidget("puzzle-grid", Control, Preview);
})();
