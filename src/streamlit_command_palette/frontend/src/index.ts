import type { FrontendRenderer } from "@streamlit/component-v2-lib";

type CommandItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  type?: string | null;
  group?: string | null;
  target?: unknown;
  url?: string | null;
  icon?: string | null;
  keywords?: string[];
  metadata?: Record<string, unknown>;
  disabled?: boolean;
};

type GroupConfig = {
  id: string;
  title: string;
  icon?: string | null;
};

type ComponentData = {
  items?: CommandItem[];
  placeholder?: string;
  shortcut?: string;
  open?: boolean;
  groups?: GroupConfig[] | null;
  maxResults?: number;
  minQueryLength?: number;
  searchFields?: string[];
  showShortcutHint?: boolean;
  emptyState?: string;
  theme?: Record<string, string>;
};

type ComponentState = {
  selected?: CommandItem | null;
};

type TriggerValueSetter = (
  name: keyof ComponentState,
  value: ComponentState[keyof ComponentState],
) => void;

type SearchResult = {
  item: CommandItem;
  score: number;
  originalIndex: number;
};

type Instance = ReturnType<typeof createInstance>;

const instances = new WeakMap<ParentNode, Instance>();

const commandSearch: FrontendRenderer<ComponentState, ComponentData> = (component) => {
  const { parentElement } = component;
  let instance = instances.get(parentElement);

  if (!instance) {
    instance = createInstance(parentElement);
    instances.set(parentElement, instance);
  }

  instance.update(component.data ?? {}, component.setTriggerValue);

  return () => {
    instance?.destroy();
    instances.delete(parentElement);
  };
};

function createInstance(parentElement: ParentNode) {
  const root =
    parentElement.querySelector<HTMLElement>(".scs-root") ??
    appendRoot(parentElement);

  root.innerHTML = `
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
  `;
  injectStyles(root);

  const trigger = required<HTMLElement>(root, ".scs-trigger");
  const triggerLabel = required<HTMLElement>(root, ".scs-trigger-label");
  const shortcutLabels = Array.from(root.querySelectorAll<HTMLElement>(".scs-shortcut"));
  const backdrop = required<HTMLElement>(root, ".scs-backdrop");
  const dialog = required<HTMLElement>(root, ".scs-dialog");
  const input = required<HTMLInputElement>(root, ".scs-input");
  const resultsEl = required<HTMLElement>(root, ".scs-results");

  let data = normalizeData({});
  let setTriggerValue: TriggerValueSetter = () => undefined;
  let query = "";
  let open = false;
  let results: SearchResult[] = [];
  let activeIndex = -1;

  const update = (
    nextData: ComponentData,
    nextSetTriggerValue: TriggerValueSetter,
  ) => {
    data = normalizeData(nextData);
    setTriggerValue = nextSetTriggerValue;
    applyTheme(root, data.theme);
    trigger.hidden = !data.showShortcutHint;
    triggerLabel.textContent = data.placeholder;
    input.placeholder = data.placeholder;
    shortcutLabels.forEach((label) => {
      label.textContent = shortcutLabel(data.shortcut);
    });
    results = searchItems(data.items, query, data);
    activeIndex = normalizeActiveIndex(results, activeIndex);
    if (data.open && !open) {
      openPalette();
    } else {
      renderResults();
    }
  };

  const openPalette = () => {
    open = true;
    backdrop.hidden = false;
    root.classList.add("scs-open");
    query = "";
    input.value = "";
    results = searchItems(data.items, query, data);
    activeIndex = firstEnabledIndex(results);
    renderResults();
    window.setTimeout(() => input.focus(), 0);
  };

  const closePalette = () => {
    if (!open) {
      return;
    }
    open = false;
    backdrop.hidden = true;
    root.classList.remove("scs-open");
    trigger.focus();
  };

  const selectActive = () => {
    if (activeIndex < 0 || activeIndex >= results.length) {
      return;
    }
    selectResult(results[activeIndex]);
  };

  const selectResult = (result: SearchResult) => {
    if (result.item.disabled) {
      return;
    }
    setTriggerValue("selected", result.item);
    closePalette();
  };

  const moveActive = (delta: number) => {
    activeIndex = moveEnabledIndex(results, activeIndex, delta);
    renderResults();
  };

  const setActive = (index: number) => {
    if (results[index]?.item.disabled) {
      return;
    }
    activeIndex = index;
    renderResults();
  };

  const onGlobalKeyDown = (event: KeyboardEvent) => {
    if (matchesShortcut(event, data.shortcut)) {
      event.preventDefault();
      open ? closePalette() : openPalette();
      return;
    }
    if (open && event.key === "Escape") {
      event.preventDefault();
      closePalette();
    }
  };

  const onInput = () => {
    query = input.value;
    results = searchItems(data.items, query, data);
    activeIndex = firstEnabledIndex(results);
    renderResults();
  };

  const onInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      activeIndex = firstEnabledIndex(results);
      renderResults();
    } else if (event.key === "End") {
      event.preventDefault();
      activeIndex = lastEnabledIndex(results);
      renderResults();
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectActive();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
    }
  };

  const onBackdropMouseDown = (event: MouseEvent) => {
    if (event.target === backdrop) {
      closePalette();
    }
  };

  const renderResults = () => {
    input.setAttribute(
      "aria-activedescendant",
      activeIndex >= 0 ? rowDomId(results[activeIndex].item.id) : "",
    );

    if (!open) {
      resultsEl.innerHTML = "";
      return;
    }

    if (results.length === 0) {
      resultsEl.innerHTML = `<div class="scs-empty">${escapeHtml(data.emptyState)}</div>`;
      return;
    }

    const grouped = groupResults(results, data.groups);
    const fragments: string[] = [];

    for (const group of grouped) {
      fragments.push(`
        <div class="scs-group">
          <div class="scs-group-label">
            <span>${escapeHtml(group.title)}</span>
            <span>${group.results.length}</span>
          </div>
          <div class="scs-group-items">
            ${group.results.map((result) => renderRow(result)).join("")}
          </div>
        </div>
      `);
    }

    resultsEl.innerHTML = fragments.join("");
    resultsEl.querySelectorAll<HTMLElement>("[data-index]").forEach((row) => {
      const index = Number(row.dataset.index);
      row.addEventListener("mouseenter", () => setActive(index));
      row.addEventListener("click", () => selectResult(results[index]));
    });
    const active = resultsEl.querySelector<HTMLElement>(".is-active");
    active?.scrollIntoView({ block: "nearest" });
  };

  const renderRow = (result: SearchResult) => {
    const index = results.indexOf(result);
    const { item } = result;
    const isActive = index === activeIndex;
    const disabled = Boolean(item.disabled);
    const subtitle = item.subtitle ? `<div class="scs-subtitle">${escapeHtml(item.subtitle)}</div>` : "";
    const type = item.type ? `<span class="scs-type">${escapeHtml(item.type)}</span>` : "";
    const className = [
      "scs-row",
      isActive ? "is-active" : "",
      disabled ? "is-disabled" : "",
    ].join(" ");

    return `
      <button id="${rowDomId(item.id)}" class="${className}" role="option"
        aria-selected="${isActive ? "true" : "false"}"
        aria-disabled="${disabled ? "true" : "false"}"
        type="button" data-index="${index}" ${disabled ? "disabled" : ""}>
        <span class="scs-icon">${escapeHtml(iconLabel(item))}</span>
        <span class="scs-copy">
          <span class="scs-title">${highlightText(item.title, query)}</span>
          ${subtitle}
        </span>
        ${type}
      </button>
    `;
  };

  trigger.addEventListener("click", openPalette);
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onInputKeyDown);
  backdrop.addEventListener("mousedown", onBackdropMouseDown);
  dialog.addEventListener("mousedown", (event) => event.stopPropagation());
  document.addEventListener("keydown", onGlobalKeyDown, true);

  return {
    destroy() {
      document.removeEventListener("keydown", onGlobalKeyDown, true);
      trigger.removeEventListener("click", openPalette);
      input.removeEventListener("input", onInput);
      input.removeEventListener("keydown", onInputKeyDown);
      backdrop.removeEventListener("mousedown", onBackdropMouseDown);
      root.innerHTML = "";
    },
    update,
  };
}

function appendRoot(parentElement: ParentNode) {
  const root = document.createElement("div");
  root.className = "scs-root";
  parentElement.appendChild(root);
  return root;
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`streamlit-command-palette missing element: ${selector}`);
  }
  return element;
}

function normalizeData(data: ComponentData) {
  return {
    items: Array.isArray(data.items) ? data.items : [],
    placeholder: data.placeholder || "Search...",
    shortcut: data.shortcut || "mod+k",
    open: Boolean(data.open),
    groups: Array.isArray(data.groups) ? data.groups : null,
    maxResults: positiveInt(data.maxResults, 10),
    minQueryLength: nonNegativeInt(data.minQueryLength, 0),
    searchFields: Array.isArray(data.searchFields)
      ? data.searchFields
      : ["title", "subtitle", "keywords", "metadata"],
    showShortcutHint: data.showShortcutHint !== false,
    emptyState: data.emptyState || "No results found",
    theme: data.theme ?? {},
  };
}

function positiveInt(value: unknown, fallback: number) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

function nonNegativeInt(value: unknown, fallback: number) {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : fallback;
}

function searchItems(
  items: CommandItem[],
  rawQuery: string,
  data: ReturnType<typeof normalizeData>,
): SearchResult[] {
  const query = normalize(rawQuery);
  if (query.length < data.minQueryLength) {
    return items.slice(0, data.maxResults).map((item, originalIndex) => ({
      item,
      score: 0,
      originalIndex,
    }));
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  const scored = items
    .map((item, originalIndex) => {
      const score = scoreItem(item, tokens, data.searchFields);
      return { item, score, originalIndex };
    })
    .filter((result) => tokens.length === 0 || result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (left.item.disabled !== right.item.disabled) {
        return left.item.disabled ? 1 : -1;
      }
      return left.originalIndex - right.originalIndex;
    });

  return scored.slice(0, data.maxResults);
}

function scoreItem(item: CommandItem, tokens: string[], fields: string[]) {
  if (tokens.length === 0) {
    return 0;
  }

  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of fields) {
      const weight = fieldWeight(field);
      for (const value of valuesForField(item, field)) {
        best = Math.max(best, scoreValue(String(value), token) * weight);
      }
    }
    if (best <= 0) {
      return 0;
    }
    total += best;
  }

  if (item.disabled) {
    total -= 5;
  }
  return total;
}

function valuesForField(item: CommandItem, field: string): unknown[] {
  if (field === "keywords") {
    return item.keywords ?? [];
  }
  if (field === "metadata") {
    return flattenValues(item.metadata ?? {});
  }
  if (field.startsWith("metadata.")) {
    return [readPath(item.metadata ?? {}, field.slice("metadata.".length))].filter(
      (value) => value !== undefined && value !== null,
    );
  }
  const value = (item as Record<string, unknown>)[field];
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null ? [] : [value];
}

function scoreValue(value: string, token: string) {
  const text = normalize(value);
  if (!text || !token) {
    return 0;
  }
  if (text === token) {
    return 120;
  }
  if (text.startsWith(token)) {
    return 100;
  }
  if (wordStartsWith(text, token)) {
    return 85;
  }
  const containsIndex = text.indexOf(token);
  if (containsIndex >= 0) {
    return Math.max(70 - containsIndex * 0.4, 45);
  }
  return fuzzyScore(text, token);
}

function fuzzyScore(text: string, token: string) {
  let textIndex = 0;
  let tokenIndex = 0;
  let score = 0;
  let streak = 0;

  while (textIndex < text.length && tokenIndex < token.length) {
    if (text[textIndex] === token[tokenIndex]) {
      streak += 1;
      score += 12 + streak * 4;
      tokenIndex += 1;
    } else {
      streak = 0;
      score -= 0.5;
    }
    textIndex += 1;
  }

  if (tokenIndex !== token.length) {
    return 0;
  }
  return Math.max(16, score - text.length * 0.15);
}

function wordStartsWith(text: string, token: string) {
  return text
    .split(/[\s_\-./:]+/)
    .some((part) => part.startsWith(token));
}

function fieldWeight(field: string) {
  if (field === "title") {
    return 1.35;
  }
  if (field === "keywords") {
    return 1.1;
  }
  if (field === "subtitle") {
    return 0.95;
  }
  if (field === "metadata" || field.startsWith("metadata.")) {
    return 0.75;
  }
  return 0.65;
}

function groupResults(results: SearchResult[], groups: GroupConfig[] | null) {
  const configured = new Map<string, GroupConfig>();
  groups?.forEach((group) => configured.set(group.id, group));

  const order = groups?.map((group) => group.id) ?? [];
  const buckets = new Map<string, SearchResult[]>();
  for (const result of results) {
    const groupId = result.item.group || result.item.type || "Results";
    if (!buckets.has(groupId)) {
      buckets.set(groupId, []);
      if (!order.includes(groupId)) {
        order.push(groupId);
      }
    }
    buckets.get(groupId)?.push(result);
  }

  return order
    .filter((groupId) => buckets.has(groupId))
    .map((groupId) => ({
      id: groupId,
      title: configured.get(groupId)?.title || groupId,
      results: buckets.get(groupId) ?? [],
    }));
}

function moveEnabledIndex(results: SearchResult[], current: number, delta: number) {
  if (results.length === 0) {
    return -1;
  }
  let index = current;
  for (let step = 0; step < results.length; step += 1) {
    index = (index + delta + results.length) % results.length;
    if (!results[index].item.disabled) {
      return index;
    }
  }
  return -1;
}

function firstEnabledIndex(results: SearchResult[]) {
  return results.findIndex((result) => !result.item.disabled);
}

function lastEnabledIndex(results: SearchResult[]) {
  for (let index = results.length - 1; index >= 0; index -= 1) {
    if (!results[index].item.disabled) {
      return index;
    }
  }
  return -1;
}

function normalizeActiveIndex(results: SearchResult[], index: number) {
  if (index >= 0 && index < results.length && !results[index].item.disabled) {
    return index;
  }
  return firstEnabledIndex(results);
}

function matchesShortcut(event: KeyboardEvent, shortcut: string) {
  const tokens = shortcut.toLowerCase().split("+").map((token) => token.trim());
  const key = tokens[tokens.length - 1];
  const wantsShift = tokens.includes("shift");
  const wantsAlt = tokens.includes("alt") || tokens.includes("option");
  const wantsMeta = tokens.includes("cmd") || tokens.includes("meta");
  const wantsCtrl = tokens.includes("ctrl") || tokens.includes("control");
  const wantsMod = tokens.includes("mod");
  const mac = isMacPlatform();

  if (wantsMod) {
    if (mac ? !event.metaKey : !event.ctrlKey) {
      return false;
    }
  }
  if (wantsMeta && !event.metaKey) {
    return false;
  }
  if (wantsCtrl && !event.ctrlKey) {
    return false;
  }
  if (wantsShift !== event.shiftKey) {
    return false;
  }
  if (wantsAlt !== event.altKey) {
    return false;
  }

  return normalizeKey(event.key) === key;
}

function shortcutLabel(shortcut: string) {
  const mac = isMacPlatform();
  return shortcut
    .split("+")
    .map((token) => {
      const lower = token.toLowerCase().trim();
      if (lower === "mod") {
        return mac ? "Cmd" : "Ctrl";
      }
      if (lower === "cmd" || lower === "meta") {
        return "Cmd";
      }
      if (lower === "ctrl" || lower === "control") {
        return "Ctrl";
      }
      if (lower === "alt" || lower === "option") {
        return "Alt";
      }
      return lower.length === 1 ? lower.toUpperCase() : capitalize(lower);
    })
    .join("+");
}

function isMacPlatform() {
  const nav = navigator as Navigator & {
    userAgentData?: {
      platform?: string;
    };
  };
  const platform = nav.userAgentData?.platform || nav.platform || "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

function normalizeKey(key: string) {
  const lower = key.toLowerCase();
  if (lower === " ") {
    return "space";
  }
  if (lower === "esc") {
    return "escape";
  }
  return lower;
}

function highlightText(text: string, rawQuery: string) {
  const query = normalize(rawQuery).split(/\s+/).filter(Boolean)[0];
  if (!query) {
    return escapeHtml(text);
  }
  const lower = normalize(text);
  const start = lower.indexOf(query);
  if (start < 0) {
    return escapeHtml(text);
  }
  const end = start + query.length;
  return `${escapeHtml(text.slice(0, start))}<mark>${escapeHtml(
    text.slice(start, end),
  )}</mark>${escapeHtml(text.slice(end))}`;
}

function iconLabel(item: CommandItem) {
  if (item.icon && !["page", "action", "dataframe", "link"].includes(item.icon)) {
    return item.icon;
  }
  if (item.icon === "page" || item.type === "page") {
    return "PG";
  }
  if (item.icon === "action" || item.type === "action") {
    return "DO";
  }
  if (item.icon === "dataframe" || item.type === "dataframe") {
    return "DF";
  }
  if (item.icon === "link" || item.url) {
    return "LN";
  }
  return "IT";
}

function rowDomId(id: string) {
  return `scs-row-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function flattenValues(value: unknown): unknown[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((inner) => flattenValues(inner));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((inner) =>
      flattenValues(inner),
    );
  }
  return [value];
}

function readPath(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function applyTheme(root: HTMLElement, theme: Record<string, string>) {
  const themeMap: Record<string, string> = {
    primaryColor: "--st-primary-color",
    backgroundColor: "--st-background-color",
    secondaryBackgroundColor: "--st-secondary-background-color",
    textColor: "--st-text-color",
    borderColor: "--st-border-color",
    font: "--st-font",
  };

  Object.entries(theme).forEach(([key, value]) => {
    if (typeof value !== "string") {
      return;
    }
    root.style.setProperty(key.startsWith("--") ? key : themeMap[key] || key, value);
  });
}

function injectStyles(root: HTMLElement) {
  const style = document.createElement("style");
  style.textContent = css;
  root.prepend(style);
}

const css = `
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

export default commandSearch;
