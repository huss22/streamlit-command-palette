# streamlit-command-palette

`streamlit-command-palette` adds a polished Cmd/Ctrl-K command palette and
global search overlay to Streamlit apps.

It is intentionally small for v1: local client-side fuzzy search, grouped
results, keyboard and mouse selection, and a simple Python API. It does not add
AI search, database search, auth, or server-side search.

## Installation

```bash
pip install streamlit-command-palette
```

Streamlit Custom Components v2 is required, so the package depends on
`streamlit>=1.54.0` and Python `>=3.10`.

## Quickstart

```python
import streamlit as st
from streamlit_command_palette import action_item, command_palette, page_item

items = [
    page_item("home", "Home", subtitle="Overview", target="Home.py"),
    page_item("reports", "Reports", subtitle="Saved reporting views"),
    action_item("refresh", "Refresh data", subtitle="Run the latest query"),
    {
        "id": "docs",
        "title": "Open documentation",
        "subtitle": "Project README and runbook",
        "type": "link",
        "group": "Resources",
        "url": "https://example.com/docs",
        "keywords": ["help", "manual", "reference"],
    },
]

selected = command_palette(items, key="global_palette")

if selected:
    st.write("Selected:", selected)
    if selected["id"] == "refresh":
        st.cache_data.clear()
        st.rerun()
```

The component opens with `Cmd+K` on macOS and `Ctrl+K` elsewhere when using the
default `shortcut="mod+k"`.

## API

```python
from streamlit_command_palette import (
    action_item,
    command_palette,
    command_search,
    dataframe_items,
    page_item,
)
```

```python
command_palette(
    items,
    placeholder="Search...",
    shortcut="mod+k",
    open=False,
    groups=None,
    max_results=10,
    min_query_length=0,
    search_fields=None,
    show_shortcut_hint=True,
    empty_state="No results found",
    key=None,
    height=None,
    theme=None,
)
```

`command_palette` returns the selected item dictionary on the Streamlit rerun
caused by selection, or `None` when nothing was selected.

`command_search` remains available as an alias for compatibility.

## Item schema

Each item supports these fields:

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | Stable unique item id. |
| `title` | yes | Primary result label. |
| `subtitle` | no | Secondary text below the title. |
| `type` | no | Item type such as `page`, `action`, `dataframe`, or `link`. |
| `group` | no | Group heading for grouped results. |
| `target` | no | JSON-safe value returned to Python for your app logic. |
| `url` | no | URL metadata returned to Python. |
| `icon` | no | Short label or icon text. Built-ins: `page`, `action`, `dataframe`, `link`. |
| `keywords` | no | Extra searchable terms. |
| `metadata` | no | JSON-safe metadata, also searchable by default. |
| `disabled` | no | Disabled items are shown but cannot be selected. |

## Helpers

```python
page_item("analytics", "Analytics", target="pages/1_Analytics.py")
action_item("clear-cache", "Clear cache", target="clear-cache")

items = dataframe_items(
    df,
    id_field="customer_id",
    title_field="customer_name",
    subtitle_fields=["segment", "region"],
    group="Customers",
)
```

## Group ordering and labels

Pass `groups` to control display order and labels:

```python
selected = command_palette(
    items,
    groups={
        "Pages": "Pages",
        "Actions": "Actions",
        "Customers": {"title": "Customers"},
    },
)
```

## Search fields

By default, the frontend searches `title`, `subtitle`, `keywords`, and
`metadata`. You can override the fields:

```python
command_palette(
    items,
    search_fields=["title", "keywords", "metadata.owner"],
    min_query_length=1,
)
```

## Theming

The component uses Streamlit theme CSS variables automatically. You can pass a
small override mapping when needed:

```python
command_palette(
    items,
    theme={
        "primaryColor": "#0f766e",
        "borderColor": "rgba(148, 163, 184, 0.35)",
    },
)
```

## Keyboard support

The overlay supports:

- `Cmd+K` on macOS and `Ctrl+K` elsewhere by default
- `Escape` to close
- `Enter` to select
- `ArrowUp` and `ArrowDown` to move
- `Home` and `End` to jump

## Examples

Run any example with Streamlit:

```bash
streamlit run examples/basic.py
streamlit run examples/actions.py
streamlit run examples/dataframe.py
streamlit run examples/multipage/Home.py
```

## Development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

cd src/streamlit_command_palette/frontend
npm install
npm run build

cd ../../../..
pytest
python -m build
```

The package includes a prebuilt `frontend/build/index.js` asset so users do not
need Node.js to install or run the component.

## Release checklist

1. Update the version in the root `pyproject.toml`, package
   `__init__.py`, and component-level `pyproject.toml`.
2. Build the frontend from `src/streamlit_command_palette/frontend`.
3. Run `pytest`.
4. Run `python -m build`.
5. Run `python -m twine check dist/*`.
6. Publish from GitHub Actions using the included TestPyPI and PyPI workflows.

GitHub Actions workflows are included for pull request CI, manual TestPyPI
publishing, and PyPI publishing from GitHub releases.

## Contributing and security

See `CONTRIBUTING.md` for development setup and pull request expectations.
See `SECURITY.md` for vulnerability reporting.
See `CODE_OF_CONDUCT.md` for community expectations.

## License

MIT
