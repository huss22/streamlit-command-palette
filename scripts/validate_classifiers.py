"""Validate project Trove classifiers against PyPI's canonical classifier list."""

from __future__ import annotations

import sys
from pathlib import Path

import tomllib
from trove_classifiers import classifiers


def main() -> int:
    pyproject = tomllib.loads(Path("pyproject.toml").read_text(encoding="utf-8"))
    project_classifiers = pyproject["project"].get("classifiers", [])
    invalid = [
        classifier
        for classifier in project_classifiers
        if classifier not in classifiers
    ]

    if invalid:
        for classifier in invalid:
            print(f"Invalid Trove classifier: {classifier}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
