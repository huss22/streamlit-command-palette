# Contributing

Thanks for taking the time to improve `streamlit-command-palette`.

## Development Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

cd src/streamlit_command_palette/frontend
npm install
npm run build

cd ../../../..
pytest
ruff check .
python -m build
python -m twine check dist/*
```

## Pull Requests

Before opening a pull request:

- Keep changes focused on one issue or feature.
- Add or update tests when behavior changes.
- Rebuild `src/streamlit_command_palette/frontend/build/index.js` when frontend source changes.
- Run `pytest`, `ruff check .`, frontend `npm run typecheck`, and `python -m twine check dist/*`.

## Release Process

1. Update the version in `pyproject.toml`, `src/streamlit_command_palette/__init__.py`, and `src/streamlit_command_palette/pyproject.toml`.
2. Add release notes to `CHANGELOG.md`.
3. Rebuild the frontend with `npm run build`.
4. Run the full local check suite.
5. Create a GitHub release tag such as `v0.1.0`.

The GitHub release workflow publishes to PyPI through Trusted Publishing.
