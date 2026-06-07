from __future__ import annotations

from pathlib import Path
from typing import Any

from ._schema import (
    CommandSearchError,
    normalize_groups,
    normalize_items,
    normalize_search_fields,
)

_COMPONENT_NAME = "streamlit-command-palette.streamlit_command_palette"
_HTML = '<div class="scs-root" data-streamlit-command-palette></div>'
_SELECTION_EVENT_ID = "__streamlitCommandPaletteSelectionId"
_renderer = None


def _load_bundled_js() -> str:
    bundle_path = Path(__file__).parent / "frontend" / "build" / "index.js"
    try:
        return bundle_path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise RuntimeError(
            "streamlit-command-palette could not find its frontend bundle. "
            "Run `npm run build` from `src/streamlit_command_palette/frontend` "
            "or install the package from PyPI."
        ) from exc


def _get_component_renderer():
    global _renderer
    if _renderer is not None:
        return _renderer

    try:
        import streamlit as st
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "streamlit-command-palette requires Streamlit. "
            "Install with `pip install streamlit-command-palette`."
        ) from exc

    components = getattr(getattr(st, "components", None), "v2", None)
    if components is None or not hasattr(components, "component"):
        raise RuntimeError(
            "streamlit-command-palette requires Streamlit Custom Components v2 "
            "(streamlit>=1.54.0)."
        )

    _renderer = components.component(
        _COMPONENT_NAME,
        html=_HTML,
        js=_load_bundled_js(),
        isolate_styles=True,
    )
    return _renderer


def command_search(
    items,
    placeholder: str = "Search...",
    shortcut: str = "mod+k",
    open: bool = False,
    groups=None,
    max_results: int = 10,
    min_query_length: int = 0,
    search_fields=None,
    show_shortcut_hint: bool = True,
    empty_state: str = "No results found",
    key: str | None = None,
    height: int | None = None,
    theme: dict[str, Any] | None = None,
):
    """Render a Cmd/Ctrl-K command palette and return the selected item.

    Returns a normalized item dictionary when the user selects an item in the
    overlay. Returns ``None`` when nothing was selected on this rerun.
    """

    if not isinstance(placeholder, str):
        raise CommandSearchError("placeholder must be a string")
    if not isinstance(shortcut, str) or not shortcut.strip():
        raise CommandSearchError("shortcut must be a non-empty string")
    if not isinstance(empty_state, str):
        raise CommandSearchError("empty_state must be a string")
    if not isinstance(max_results, int) or max_results <= 0:
        raise CommandSearchError("max_results must be a positive integer")
    if not isinstance(min_query_length, int) or min_query_length < 0:
        raise CommandSearchError("min_query_length must be an integer >= 0")
    if height is not None and (not isinstance(height, int) or height < 0):
        raise CommandSearchError("height must be a non-negative integer or None")
    if theme is not None and not isinstance(theme, dict):
        raise CommandSearchError("theme must be a mapping or None")

    data = {
        "items": normalize_items(items),
        "placeholder": placeholder,
        "shortcut": shortcut,
        "open": bool(open),
        "groups": normalize_groups(groups),
        "maxResults": max_results,
        "minQueryLength": min_query_length,
        "searchFields": normalize_search_fields(search_fields),
        "showShortcutHint": bool(show_shortcut_hint),
        "emptyState": empty_state,
        "theme": theme or {},
    }

    rendered_height = height
    if rendered_height is None:
        rendered_height = 44 if show_shortcut_hint else 0

    result = _get_component_renderer()(
        key=key,
        data=data,
        height=rendered_height,
        on_selected_change=lambda: None,
    )
    selected = getattr(result, "selected", None)
    if isinstance(selected, dict):
        selected = dict(selected)
        selected.pop(_SELECTION_EVENT_ID, None)
    return selected


command_palette = command_search
