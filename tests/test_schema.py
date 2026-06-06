from dataclasses import dataclass
from datetime import date

import pytest

from streamlit_command_palette import (
    CommandSearchError,
    action_item,
    dataframe_items,
    normalize_item,
    normalize_items,
    page_item,
)
from streamlit_command_palette._schema import normalize_groups, normalize_search_fields


@dataclass
class Item:
    id: str
    title: str
    metadata: dict


def test_page_item_normalizes_required_schema():
    item = page_item(
        "home",
        "Home",
        subtitle="Overview",
        url="/home",
        keywords=["start"],
        metadata={"created": date(2026, 1, 1)},
    )

    assert item == {
        "id": "home",
        "title": "Home",
        "subtitle": "Overview",
        "type": "page",
        "group": "Pages",
        "target": "/home",
        "url": "/home",
        "icon": "page",
        "keywords": ["start"],
        "metadata": {"created": "2026-01-01"},
        "disabled": False,
    }


def test_action_item_defaults_target_to_id():
    item = action_item("refresh", "Refresh")

    assert item["type"] == "action"
    assert item["target"] == "refresh"
    assert item["group"] == "Actions"


def test_normalize_item_accepts_dataclass():
    item = normalize_item(Item("row-1", "Row 1", {"score": 10}))

    assert item["id"] == "row-1"
    assert item["metadata"] == {"score": 10}


def test_normalize_items_rejects_duplicates():
    with pytest.raises(CommandSearchError, match="duplicates"):
        normalize_items(
            [
                {"id": "same", "title": "First"},
                {"id": "same", "title": "Second"},
            ]
        )


def test_dataframe_items_from_rows():
    items = dataframe_items(
        [
            {"customer_id": "C1", "name": "Acme", "region": "APAC"},
            {"customer_id": "C2", "name": "Beta", "region": "EMEA"},
        ],
        id_field="customer_id",
        title_field="name",
        subtitle_fields=["region"],
        group="Customers",
    )

    assert [item["id"] for item in items] == ["C1", "C2"]
    assert items[0]["title"] == "Acme"
    assert items[0]["subtitle"] == "APAC"
    assert items[0]["metadata"]["region"] == "APAC"


def test_dataframe_items_from_column_mapping():
    items = dataframe_items(
        {"id": ["a", "b"], "title": ["Alpha", "Beta"]},
        id_field="id",
        title_field="title",
    )

    assert [item["title"] for item in items] == ["Alpha", "Beta"]


def test_groups_accept_mapping_and_sequence():
    assert normalize_groups({"Pages": "Navigation"}) == [
        {"id": "Pages", "title": "Navigation", "icon": None}
    ]
    assert normalize_groups(["Pages"]) == [
        {"id": "Pages", "title": "Pages", "icon": None}
    ]


def test_search_fields_validation():
    assert normalize_search_fields(None) == [
        "title",
        "subtitle",
        "keywords",
        "metadata",
    ]
    with pytest.raises(CommandSearchError):
        normalize_search_fields([])
