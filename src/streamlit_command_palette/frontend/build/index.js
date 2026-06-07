const C = /* @__PURE__ */ new WeakMap(), be = (e) => {
  const { parentElement: t } = e;
  let s = C.get(t);
  return s || (s = Q(t), C.set(t, s)), s.update(e.data ?? {}, e.setTriggerValue), () => {
    s == null || s.destroy(), C.delete(t);
  };
};
function Q(e) {
  const t = e.querySelector(".scs-root") ?? G(e);
  t.innerHTML = `
    <button class="scs-trigger" type="button" aria-haspopup="dialog">
      <span class="scs-trigger-search">
        <span class="scs-trigger-icon">/</span>
        <span class="scs-trigger-label"></span>
      </span>
      <span class="scs-shortcut" aria-hidden="true"></span>
    </button>
    <div class="scs-backdrop" hidden>
      <div class="scs-dialog" role="dialog" aria-modal="true">
        <div class="scs-searchbar">
          <span class="scs-search-icon">/</span>
          <input class="scs-input" role="combobox" aria-expanded="true"
            aria-autocomplete="list" autocomplete="off" spellcheck="false" />
          <span class="scs-shortcut scs-dialog-shortcut" aria-hidden="true"></span>
        </div>
        <div class="scs-results" role="listbox"></div>
      </div>
    </div>
  `, he(t);
  const s = v(t, ".scs-trigger"), r = v(t, ".scs-trigger-label"), a = Array.from(t.querySelectorAll(".scs-shortcut")), c = v(t, ".scs-backdrop"), o = v(t, ".scs-dialog"), i = v(t, ".scs-input"), m = v(t, ".scs-results");
  let d = H({}), k = () => {
  }, b = "", x = !1, u = [], p = -1, M = 0;
  const P = (n, f) => {
    d = H(n), k = f, ge(t, d.theme), s.hidden = !d.showShortcutHint, r.textContent = d.placeholder, i.placeholder = d.placeholder, a.forEach((l) => {
      l.textContent = le(d.shortcut);
    }), u = $(d.items, b, d), p = ae(u, p), d.open && !x ? L() : y();
  }, L = () => {
    x = !0, c.hidden = !1, t.classList.add("scs-open"), b = "", i.value = "", u = $(d.items, b, d), p = A(u), y(), window.setTimeout(() => i.focus(), 0);
  }, w = () => {
    x && (x = !1, c.hidden = !0, t.classList.remove("scs-open"), s.focus());
  }, W = () => {
    p < 0 || p >= u.length || D(u[p]);
  }, D = (n) => {
    n.item.disabled || (M += 1, k("selected", {
      ...n.item,
      __streamlitCommandPaletteSelectionId: M
    }), w());
  }, j = (n) => {
    p = oe(u, p, n), y();
  }, B = (n) => {
    var f;
    (f = u[n]) != null && f.item.disabled || n !== p && (p = n, S());
  }, N = (n) => {
    if (ce(n, d.shortcut)) {
      n.preventDefault(), x ? w() : L();
      return;
    }
    x && n.key === "Escape" && (n.preventDefault(), w());
  }, q = () => {
    b = i.value, u = $(d.items, b, d), p = A(u), y();
  }, R = (n) => {
    n.key === "ArrowDown" ? (n.preventDefault(), j(1)) : n.key === "ArrowUp" ? (n.preventDefault(), j(-1)) : n.key === "Home" ? (n.preventDefault(), p = A(u), y()) : n.key === "End" ? (n.preventDefault(), p = ie(u), y()) : n.key === "Enter" ? (n.preventDefault(), W()) : n.key === "Escape" && (n.preventDefault(), w());
  }, T = (n) => {
    n.target === c && w();
  }, y = () => {
    if (S(), !x) {
      m.innerHTML = "";
      return;
    }
    if (u.length === 0) {
      m.innerHTML = `<div class="scs-empty">${h(d.emptyState)}</div>`;
      return;
    }
    const n = ne(u, d.groups), f = [];
    for (const l of n)
      f.push(`
        <div class="scs-group">
          <div class="scs-group-label">
            <span>${h(l.title)}</span>
            <span>${l.results.length}</span>
          </div>
          <div class="scs-group-items">
            ${l.results.map((g) => O(g)).join("")}
          </div>
        </div>
      `);
    m.innerHTML = f.join(""), m.querySelectorAll("[data-index]").forEach((l) => {
      const g = Number(l.dataset.index);
      l.addEventListener("mouseenter", () => B(g)), l.addEventListener("click", () => D(u[g]));
    }), S();
  }, S = () => {
    i.setAttribute(
      "aria-activedescendant",
      p >= 0 ? K(u[p].item.id) : ""
    ), m.querySelectorAll("[data-index]").forEach((f) => {
      const g = Number(f.dataset.index) === p;
      f.classList.toggle("is-active", g), f.setAttribute("aria-selected", g ? "true" : "false");
    });
    const n = m.querySelector(".is-active");
    n == null || n.scrollIntoView({ block: "nearest" });
  }, O = (n) => {
    const f = u.indexOf(n), { item: l } = n, g = f === p, I = !!l.disabled, V = l.subtitle ? `<div class="scs-subtitle">${h(l.subtitle)}</div>` : "", U = l.type ? `<span class="scs-type">${h(l.type)}</span>` : "", _ = [
      "scs-row",
      g ? "is-active" : "",
      I ? "is-disabled" : ""
    ].join(" ");
    return `
      <button id="${K(l.id)}" class="${_}" role="option"
        aria-selected="${g ? "true" : "false"}"
        aria-disabled="${I ? "true" : "false"}"
        type="button" data-index="${f}" ${I ? "disabled" : ""}>
        <span class="scs-icon">${h(pe(l))}</span>
        <span class="scs-copy">
          <span class="scs-title">${ue(l.title, b)}</span>
          ${V}
        </span>
        ${U}
      </button>
    `;
  };
  return s.addEventListener("click", L), i.addEventListener("input", q), i.addEventListener("keydown", R), c.addEventListener("mousedown", T), o.addEventListener("mousedown", (n) => n.stopPropagation()), document.addEventListener("keydown", N, !0), {
    destroy() {
      document.removeEventListener("keydown", N, !0), s.removeEventListener("click", L), i.removeEventListener("input", q), i.removeEventListener("keydown", R), c.removeEventListener("mousedown", T), t.innerHTML = "";
    },
    update: P
  };
}
function G(e) {
  const t = document.createElement("div");
  return t.className = "scs-root", e.appendChild(t), t;
}
function v(e, t) {
  const s = e.querySelector(t);
  if (!s)
    throw new Error(`streamlit-command-palette missing element: ${t}`);
  return s;
}
function H(e) {
  return {
    items: Array.isArray(e.items) ? e.items : [],
    placeholder: e.placeholder || "Search...",
    shortcut: e.shortcut || "mod+k",
    open: !!e.open,
    groups: Array.isArray(e.groups) ? e.groups : null,
    maxResults: Z(e.maxResults, 10),
    minQueryLength: J(e.minQueryLength, 0),
    searchFields: Array.isArray(e.searchFields) ? e.searchFields : ["title", "subtitle", "keywords", "metadata"],
    showShortcutHint: e.showShortcutHint !== !1,
    emptyState: e.emptyState || "No results found",
    theme: e.theme ?? {}
  };
}
function Z(e, t) {
  return Number.isInteger(e) && Number(e) > 0 ? Number(e) : t;
}
function J(e, t) {
  return Number.isInteger(e) && Number(e) >= 0 ? Number(e) : t;
}
function $(e, t, s) {
  const r = E(t);
  if (r.length < s.minQueryLength)
    return e.slice(0, s.maxResults).map((o, i) => ({
      item: o,
      score: 0,
      originalIndex: i
    }));
  const a = r.split(/\s+/).filter(Boolean);
  return e.map((o, i) => {
    const m = X(o, a, s.searchFields);
    return { item: o, score: m, originalIndex: i };
  }).filter((o) => a.length === 0 || o.score > 0).sort((o, i) => i.score !== o.score ? i.score - o.score : o.item.disabled !== i.item.disabled ? o.item.disabled ? 1 : -1 : o.originalIndex - i.originalIndex).slice(0, s.maxResults);
}
function X(e, t, s) {
  if (t.length === 0)
    return 0;
  let r = 0;
  for (const a of t) {
    let c = 0;
    for (const o of s) {
      const i = re(o);
      for (const m of Y(e, o))
        c = Math.max(c, ee(String(m), a) * i);
    }
    if (c <= 0)
      return 0;
    r += c;
  }
  return e.disabled && (r -= 5), r;
}
function Y(e, t) {
  if (t === "keywords")
    return e.keywords ?? [];
  if (t === "metadata")
    return z(e.metadata ?? {});
  if (t.startsWith("metadata."))
    return [fe(e.metadata ?? {}, t.slice(9))].filter(
      (r) => r != null
    );
  const s = e[t];
  return Array.isArray(s) ? s : s == null ? [] : [s];
}
function ee(e, t) {
  const s = E(e);
  if (!s || !t)
    return 0;
  if (s === t)
    return 120;
  if (s.startsWith(t))
    return 100;
  if (se(s, t))
    return 85;
  const r = s.indexOf(t);
  return r >= 0 ? Math.max(70 - r * 0.4, 45) : te(s, t);
}
function te(e, t) {
  let s = 0, r = 0, a = 0, c = 0;
  for (; s < e.length && r < t.length; )
    e[s] === t[r] ? (c += 1, a += 12 + c * 4, r += 1) : (c = 0, a -= 0.5), s += 1;
  return r !== t.length ? 0 : Math.max(16, a - e.length * 0.15);
}
function se(e, t) {
  return e.split(/[\s_\-./:]+/).some((s) => s.startsWith(t));
}
function re(e) {
  return e === "title" ? 1.35 : e === "keywords" ? 1.1 : e === "subtitle" ? 0.95 : e === "metadata" || e.startsWith("metadata.") ? 0.75 : 0.65;
}
function ne(e, t) {
  var c;
  const s = /* @__PURE__ */ new Map();
  t == null || t.forEach((o) => s.set(o.id, o));
  const r = (t == null ? void 0 : t.map((o) => o.id)) ?? [], a = /* @__PURE__ */ new Map();
  for (const o of e) {
    const i = o.item.group || o.item.type || "Results";
    a.has(i) || (a.set(i, []), r.includes(i) || r.push(i)), (c = a.get(i)) == null || c.push(o);
  }
  return r.filter((o) => a.has(o)).map((o) => {
    var i;
    return {
      id: o,
      title: ((i = s.get(o)) == null ? void 0 : i.title) || o,
      results: a.get(o) ?? []
    };
  });
}
function oe(e, t, s) {
  if (e.length === 0)
    return -1;
  let r = t;
  for (let a = 0; a < e.length; a += 1)
    if (r = (r + s + e.length) % e.length, !e[r].item.disabled)
      return r;
  return -1;
}
function A(e) {
  return e.findIndex((t) => !t.item.disabled);
}
function ie(e) {
  for (let t = e.length - 1; t >= 0; t -= 1)
    if (!e[t].item.disabled)
      return t;
  return -1;
}
function ae(e, t) {
  return t >= 0 && t < e.length && !e[t].item.disabled ? t : A(e);
}
function ce(e, t) {
  const s = t.toLowerCase().split("+").map((k) => k.trim()), r = s[s.length - 1], a = s.includes("shift"), c = s.includes("alt") || s.includes("option"), o = s.includes("cmd") || s.includes("meta"), i = s.includes("ctrl") || s.includes("control"), m = s.includes("mod"), d = F();
  return m && (d ? !e.metaKey : !e.ctrlKey) || o && !e.metaKey || i && !e.ctrlKey || a !== e.shiftKey || c !== e.altKey ? !1 : de(e.key) === r;
}
function le(e) {
  const t = F();
  return e.split("+").map((s) => {
    const r = s.toLowerCase().trim();
    return r === "mod" ? t ? "Cmd" : "Ctrl" : r === "cmd" || r === "meta" ? "Cmd" : r === "ctrl" || r === "control" ? "Ctrl" : r === "alt" || r === "option" ? "Alt" : r.length === 1 ? r.toUpperCase() : me(r);
  }).join("+");
}
function F() {
  var s;
  const e = navigator, t = ((s = e.userAgentData) == null ? void 0 : s.platform) || e.platform || "";
  return /mac|iphone|ipad|ipod/i.test(t);
}
function de(e) {
  const t = e.toLowerCase();
  return t === " " ? "space" : t === "esc" ? "escape" : t;
}
function ue(e, t) {
  const s = E(t).split(/\s+/).filter(Boolean)[0];
  if (!s)
    return h(e);
  const a = E(e).indexOf(s);
  if (a < 0)
    return h(e);
  const c = a + s.length;
  return `${h(e.slice(0, a))}<mark>${h(
    e.slice(a, c)
  )}</mark>${h(e.slice(c))}`;
}
function pe(e) {
  return e.icon && !["page", "action", "dataframe", "link"].includes(e.icon) ? e.icon : e.icon === "page" || e.type === "page" ? "PG" : e.icon === "action" || e.type === "action" ? "DO" : e.icon === "dataframe" || e.type === "dataframe" ? "DF" : e.icon === "link" || e.url ? "LN" : "IT";
}
function K(e) {
  return `scs-row-${e.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function z(e) {
  return e == null ? [] : Array.isArray(e) ? e.flatMap((t) => z(t)) : typeof e == "object" ? Object.values(e).flatMap(
    (t) => z(t)
  ) : [e];
}
function fe(e, t) {
  return t.split(".").reduce((s, r) => {
    if (s && typeof s == "object" && r in s)
      return s[r];
  }, e);
}
function E(e) {
  return e.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
}
function me(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function h(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function ge(e, t) {
  const s = {
    primaryColor: "--st-primary-color",
    backgroundColor: "--st-background-color",
    secondaryBackgroundColor: "--st-secondary-background-color",
    textColor: "--st-text-color",
    borderColor: "--st-border-color",
    font: "--st-font"
  };
  Object.entries(t).forEach(([r, a]) => {
    typeof a == "string" && e.style.setProperty(r.startsWith("--") ? r : s[r] || r, a);
  });
}
function he(e) {
  const t = document.createElement("style");
  t.textContent = xe, e.prepend(t);
}
const xe = `
.scs-root {
  --scs-bg: var(--st-background-color, #ffffff);
  --scs-elevated: color-mix(in srgb, var(--st-background-color, #ffffff) 92%, black 8%);
  --scs-soft: var(--st-secondary-background-color, #f6f7f9);
  --scs-text: var(--st-text-color, #20242a);
  --scs-muted: color-mix(in srgb, var(--st-text-color, #20242a) 62%, transparent);
  --scs-border: var(--st-border-color, rgba(49, 51, 63, 0.18));
  --scs-accent: var(--st-primary-color, #ff4b4b);
  --scs-radius: min(var(--st-base-radius, 8px), 12px);
  color: var(--scs-text);
  font-family: var(--st-font, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  line-height: 1.4;
}

.scs-trigger {
  align-items: center;
  background: var(--scs-soft);
  border: 1px solid var(--scs-border);
  border-radius: var(--scs-radius);
  color: var(--scs-muted);
  cursor: pointer;
  display: flex;
  font: inherit;
  height: 40px;
  justify-content: space-between;
  padding: 0 10px;
  transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;
  width: 100%;
}

.scs-trigger:hover,
.scs-trigger:focus-visible {
  border-color: color-mix(in srgb, var(--scs-accent) 70%, var(--scs-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--scs-accent) 14%, transparent);
  outline: none;
}

.scs-trigger-search {
  align-items: center;
  display: flex;
  gap: 9px;
  min-width: 0;
}

.scs-trigger-icon,
.scs-search-icon {
  align-items: center;
  background: color-mix(in srgb, var(--scs-text) 7%, transparent);
  border: 1px solid color-mix(in srgb, var(--scs-border) 80%, transparent);
  border-radius: 6px;
  color: var(--scs-muted);
  display: inline-flex;
  font-size: 13px;
  font-weight: 700;
  height: 22px;
  justify-content: center;
  width: 22px;
}

.scs-trigger-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scs-shortcut {
  background: color-mix(in srgb, var(--scs-bg) 78%, var(--scs-text) 8%);
  border: 1px solid var(--scs-border);
  border-radius: 6px;
  color: var(--scs-muted);
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 650;
  line-height: 1;
  padding: 5px 6px;
}

.scs-backdrop {
  align-items: flex-start;
  background: rgba(0, 0, 0, 0.36);
  box-sizing: border-box;
  display: flex;
  inset: 0;
  justify-content: center;
  padding: clamp(56px, 12vh, 120px) 16px 24px;
  position: fixed;
  z-index: 2147483000;
}

.scs-backdrop[hidden] {
  display: none;
}

.scs-dialog {
  background: var(--scs-bg);
  border: 1px solid var(--scs-border);
  border-radius: 12px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28), 0 2px 10px rgba(0, 0, 0, 0.12);
  max-height: min(680px, calc(100vh - 96px));
  overflow: hidden;
  width: min(720px, calc(100vw - 32px));
}

.scs-searchbar {
  align-items: center;
  border-bottom: 1px solid var(--scs-border);
  display: flex;
  gap: 10px;
  padding: 12px;
}

.scs-input {
  background: transparent;
  border: 0;
  color: var(--scs-text);
  flex: 1 1 auto;
  font: inherit;
  font-size: 15px;
  min-width: 0;
  outline: none;
}

.scs-input::placeholder {
  color: var(--scs-muted);
}

.scs-results {
  max-height: min(560px, calc(100vh - 180px));
  overflow-y: auto;
  padding: 8px;
}

.scs-group + .scs-group {
  margin-top: 8px;
}

.scs-group-label {
  align-items: center;
  color: var(--scs-muted);
  display: flex;
  font-size: 11px;
  font-weight: 700;
  justify-content: space-between;
  padding: 7px 8px 5px;
  text-transform: uppercase;
}

.scs-group-items {
  display: grid;
  gap: 2px;
}

.scs-row {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: var(--scs-text);
  cursor: pointer;
  display: grid;
  font: inherit;
  gap: 10px;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  min-height: 54px;
  padding: 8px;
  text-align: left;
  width: 100%;
}

.scs-row.is-active {
  background: color-mix(in srgb, var(--scs-accent) 14%, transparent);
}

.scs-row.is-disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.scs-icon {
  align-items: center;
  background: color-mix(in srgb, var(--scs-text) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--scs-border) 80%, transparent);
  border-radius: 8px;
  color: var(--scs-muted);
  display: flex;
  font-size: 10px;
  font-weight: 800;
  height: 32px;
  justify-content: center;
  letter-spacing: 0;
  overflow: hidden;
  width: 32px;
}

.scs-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.scs-title,
.scs-subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scs-title {
  color: var(--scs-text);
  font-size: 14px;
  font-weight: 650;
}

.scs-subtitle {
  color: var(--scs-muted);
  font-size: 12px;
}

.scs-title mark {
  background: color-mix(in srgb, var(--scs-accent) 24%, transparent);
  border-radius: 4px;
  color: inherit;
  padding: 0 1px;
}

.scs-type {
  border: 1px solid var(--scs-border);
  border-radius: 999px;
  color: var(--scs-muted);
  font-size: 11px;
  font-weight: 650;
  max-width: 130px;
  overflow: hidden;
  padding: 3px 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scs-empty {
  color: var(--scs-muted);
  padding: 28px 12px 30px;
  text-align: center;
}

@media (max-width: 520px) {
  .scs-backdrop {
    padding: 20px 10px;
  }

  .scs-dialog {
    max-height: calc(100vh - 40px);
    width: calc(100vw - 20px);
  }

  .scs-dialog-shortcut,
  .scs-type {
    display: none;
  }

  .scs-row {
    grid-template-columns: 32px minmax(0, 1fr);
  }
}
`;
export {
  be as default
};
