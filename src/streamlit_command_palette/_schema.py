from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import asdict, is_dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any


class CommandSearchError(ValueError):
    """Raised when command palette input cannot be normalized safely."""


ITEM_FIELDS = (
    "id",
    "title",
    "subtitle",
    "type",
    "group",
    "target",
    "url",
    "icon",
    "keywords",
    "metadata",
    "disabled",
)

DEFAULT_SEARCH_FIELDS = ("title", "subtitle", "keywords", "metadata")


def page_item(
    id: str,
    title: str,
    *,
    subtitle: str | None = None,
    group: str | None = "Pages",
    target: Any | None = None,
    url: str | None = None,
    icon: str | None = "page",
    keywords: Sequence[Any] | None = None,
    metadata: Mapping[str, Any] | None = None,
    disabled: bool = False,
) -> dict[str, Any]:
    """Create a normalized page/navigation item."""

    return normalize_item(
        {
            "id": id,
            "title": title,
            "subtitle": subtitle,
            "type": "page",
            "group": group,
            "target": target if target is not None else url,
            "url": url,
            "icon": icon,
            "keywords": keywords,
            "metadata": metadata,
            "disabled": disabled,
        }
    )


def action_item(
    id: str,
    title: str,
    *,
    subtitle: str | None = None,
    group: str | None = "Actions",
    target: Any | None = None,
    icon: str | None = "action",
    keywords: Sequence[Any] | None = None,
    metadata: Mapping[str, Any] | None = None,
    disabled: bool = False,
) -> dict[str, Any]:
    """Create a normalized action item.

    The component returns the selected item to Python. Execute the action in
    your Streamlit script by inspecting the returned item id or target.
    """

    return normalize_item(
        {
            "id": id,
            "title": title,
            "subtitle": subtitle,
            "type": "action",
            "group": group,
            "target": target if target is not None else id,
            "url": None,
            "icon": icon,
            "keywords": keywords,
            "metadata": metadata,
            "disabled": disabled,
        }
    )


def dataframe_items(
    data: Any,
    *,
    id_field: str | None = None,
    title_field: str | None = None,
    subtitle_fields: str | Sequence[str] | None = None,
    group: str | None = "Data",
    target_field: str | None = None,
    icon: str | None = "dataframe",
    keywords_fields: Sequence[str] | None = None,
    metadata_fields: Sequence[str] | None = None,
    max_items: int | None = None,
    id_prefix: str = "row",
    disabled_field: str | None = None,
) -> list[dict[str, Any]]:
    """Convert DataFrame-like records into command palette items.

    Accepts a pandas DataFrame, any object with ``to_dict(orient="records")``,
    a mapping of columns to values, or an iterable of row mappings.
    """

    records = _records_from_data(data)
    if max_items is not None:
        if max_items < 0:
            raise CommandSearchError("max_items must be greater than or equal to 0")
        records = records[:max_items]

    items: list[dict[str, Any]] = []
    for index, record in enumerate(records):
        if not isinstance(record, Mapping):
            raise CommandSearchError("dataframe_items rows must be mappings")
        row = {str(key): _json_safe(value) for key, value in record.items()}
        inferred_title_field = title_field or _first_present(
            row, ("title", "name", "label")
        )
        if inferred_title_field is None and row:
            inferred_title_field = next(iter(row))
        if inferred_title_field is None:
            raise CommandSearchError("Cannot infer a title field from empty row data")

        row_id = _field_value(row, id_field) if id_field else row.get("id")
        item_id = str(row_id) if row_id not in (None, "") else f"{id_prefix}-{index}"
        title = str(row.get(inferred_title_field, item_id))
        subtitle = _subtitle_from_fields(row, subtitle_fields, inferred_title_field)
        metadata_keys = (
            list(metadata_fields) if metadata_fields is not None else list(row)
        )
        keyword_keys = (
            list(keywords_fields) if keywords_fields is not None else list(row)
        )
        target = _field_value(row, target_field) if target_field else item_id
        disabled = bool(_field_value(row, disabled_field)) if disabled_field else False

        items.append(
            normalize_item(
                {
                    "id": item_id,
                    "title": title,
                    "subtitle": subtitle,
                    "type": "dataframe",
                    "group": group,
                    "target": target,
                    "url": None,
                    "icon": icon,
                    "keywords": [row[key] for key in keyword_keys if key in row],
                    "metadata": {key: row[key] for key in metadata_keys if key in row},
                    "disabled": disabled,
                }
            )
        )
    return items


def normalize_items(items: Iterable[Any]) -> list[dict[str, Any]]:
    """Normalize and validate a collection of command palette items."""

    if isinstance(items, (str, bytes)) or not isinstance(items, Iterable):
        raise CommandSearchError("items must be an iterable of mappings")

    normalized = [normalize_item(item, index=index) for index, item in enumerate(items)]
    seen: set[str] = set()
    duplicates: set[str] = set()
    for item in normalized:
        item_id = item["id"]
        if item_id in seen:
            duplicates.add(item_id)
        seen.add(item_id)
    if duplicates:
        duplicate_list = ", ".join(sorted(duplicates))
        raise CommandSearchError(
            f"item ids must be unique; duplicates: {duplicate_list}"
        )
    return normalized


def normalize_item(item: Any, *, index: int | None = None) -> dict[str, Any]:
    """Normalize and validate a single command palette item."""

    raw = _mapping_from_item(item)
    suffix = f" at index {index}" if index is not None else ""
    item_id = raw.get("id")
    title = raw.get("title")
    if item_id in (None, ""):
        raise CommandSearchError(f"item{suffix} is missing required field 'id'")
    if title in (None, ""):
        raise CommandSearchError(f"item{suffix} is missing required field 'title'")

    return {
        "id": str(item_id),
        "title": str(title),
        "subtitle": _optional_string(raw.get("subtitle")),
        "type": str(raw.get("type") or "item"),
        "group": _optional_string(raw.get("group")),
        "target": _json_safe(raw.get("target")),
        "url": _optional_string(raw.get("url")),
        "icon": _optional_string(raw.get("icon")),
        "keywords": _normalize_keywords(raw.get("keywords")),
        "metadata": _normalize_metadata(raw.get("metadata")),
        "disabled": bool(raw.get("disabled", False)),
    }


def normalize_groups(groups: Any) -> list[dict[str, Any]] | None:
    """Normalize group ordering/labels for the frontend."""

    if groups is None:
        return None
    if isinstance(groups, Mapping):
        output = []
        for group_id, config in groups.items():
            if isinstance(config, Mapping):
                output.append(
                    {
                        "id": str(group_id),
                        "title": str(
                            config.get("title") or config.get("label") or group_id
                        ),
                        "icon": _optional_string(config.get("icon")),
                    }
                )
            else:
                output.append({"id": str(group_id), "title": str(config), "icon": None})
        return output
    if isinstance(groups, (str, bytes)) or not isinstance(groups, Iterable):
        raise CommandSearchError("groups must be a mapping or iterable")

    output = []
    for entry in groups:
        if isinstance(entry, Mapping):
            group_id = entry.get("id") or entry.get("group") or entry.get("title")
            if group_id in (None, ""):
                raise CommandSearchError("group entries must include id or title")
            output.append(
                {
                    "id": str(group_id),
                    "title": str(entry.get("title") or entry.get("label") or group_id),
                    "icon": _optional_string(entry.get("icon")),
                }
            )
        else:
            output.append({"id": str(entry), "title": str(entry), "icon": None})
    return output


def normalize_search_fields(search_fields: Sequence[str] | None) -> list[str]:
    if search_fields is None:
        return list(DEFAULT_SEARCH_FIELDS)
    if isinstance(search_fields, (str, bytes)) or not isinstance(
        search_fields, Sequence
    ):
        raise CommandSearchError("search_fields must be a sequence of field names")
    output = [str(field) for field in search_fields]
    if not output:
        raise CommandSearchError("search_fields cannot be empty")
    return output


def _mapping_from_item(item: Any) -> Mapping[str, Any]:
    if isinstance(item, Mapping):
        return item
    if is_dataclass(item) and not isinstance(item, type):
        return asdict(item)
    if hasattr(item, "_asdict"):
        value = item._asdict()
        if isinstance(value, Mapping):
            return value
    raise CommandSearchError("each item must be a mapping or dataclass")


def _records_from_data(data: Any) -> list[Mapping[str, Any]]:
    if hasattr(data, "to_dict"):
        try:
            records = data.to_dict(orient="records")
        except TypeError:
            records = data.to_dict()
        if isinstance(records, list):
            return records
        if isinstance(records, Mapping):
            keys = list(records)
            if not keys:
                return []
            length = len(records[keys[0]])
            return [
                {key: records[key][index] for key in keys}
                for index in range(length)
            ]
    if isinstance(data, Mapping):
        keys = list(data)
        if not keys:
            return []
        first = data[keys[0]]
        if isinstance(first, Sequence) and not isinstance(first, (str, bytes)):
            return [
                {key: data[key][index] for key in keys}
                for index in range(len(first))
            ]
        return [data]
    if isinstance(data, Iterable) and not isinstance(data, (str, bytes)):
        return list(data)
    raise CommandSearchError("data must be DataFrame-like or iterable row mappings")


def _json_safe(value: Any) -> Any:
    if value is None or isinstance(value, (str, bool, int, float)):
        return value
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Enum):
        return _json_safe(value.value)
    if isinstance(value, Mapping):
        return {str(key): _json_safe(inner) for key, inner in value.items()}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [_json_safe(inner) for inner in value]
    return str(value)


def _normalize_keywords(value: Any) -> list[str]:
    if value in (None, ""):
        return []
    if isinstance(value, (str, bytes)):
        return [str(value)]
    if isinstance(value, Iterable):
        return [str(_json_safe(item)) for item in value if item not in (None, "")]
    return [str(_json_safe(value))]


def _normalize_metadata(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, Mapping):
        raise CommandSearchError("metadata must be a mapping")
    return {str(key): _json_safe(inner) for key, inner in value.items()}


def _optional_string(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def _first_present(row: Mapping[str, Any], candidates: Sequence[str]) -> str | None:
    for candidate in candidates:
        if candidate in row and row[candidate] not in (None, ""):
            return candidate
    return None


def _field_value(row: Mapping[str, Any], field: str | None) -> Any:
    if field is None:
        return None
    return row.get(field)


def _subtitle_from_fields(
    row: Mapping[str, Any],
    subtitle_fields: str | Sequence[str] | None,
    title_field: str,
) -> str | None:
    if isinstance(subtitle_fields, str):
        value = row.get(subtitle_fields)
        return None if value in (None, "") else str(value)
    if subtitle_fields is not None:
        pieces = [
            str(row[field])
            for field in subtitle_fields
            if field in row and row[field] not in (None, "")
        ]
        return " - ".join(pieces) or None

    pieces = []
    for key, value in row.items():
        if key == title_field or value in (None, ""):
            continue
        pieces.append(f"{key}: {value}")
        if len(pieces) == 2:
            break
    return " - ".join(pieces) or None
