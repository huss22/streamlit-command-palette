import pytest

from streamlit_command_palette import (
    CommandSearchError,
    _component,
    command_palette,
    command_search,
)


class Result:
    selected = {"id": "home", "title": "Home"}


def test_command_search_returns_selected_item(monkeypatch):
    calls = []

    def renderer(**kwargs):
        calls.append(kwargs)
        return Result()

    monkeypatch.setattr(_component, "_get_component_renderer", lambda: renderer)

    selected = command_search(
        [{"id": "home", "title": "Home"}],
        key="search",
        groups=["Pages"],
        max_results=5,
    )

    assert selected == {"id": "home", "title": "Home"}
    assert calls[0]["key"] == "search"
    assert calls[0]["height"] == 44
    assert calls[0]["data"]["maxResults"] == 5
    assert calls[0]["data"]["groups"] == [
        {"id": "Pages", "title": "Pages", "icon": None}
    ]


def test_command_palette_alias_returns_selected_item(monkeypatch):
    def renderer(**kwargs):
        return Result()

    monkeypatch.setattr(_component, "_get_component_renderer", lambda: renderer)

    assert command_palette([{"id": "home", "title": "Home"}]) == {
        "id": "home",
        "title": "Home",
    }


def test_command_search_strips_internal_selection_event_id(monkeypatch):
    class EventResult:
        selected = {
            "id": "home",
            "title": "Home",
            _component._SELECTION_EVENT_ID: 1,
        }

    def renderer(**kwargs):
        return EventResult()

    monkeypatch.setattr(_component, "_get_component_renderer", lambda: renderer)

    assert command_search([{"id": "home", "title": "Home"}]) == {
        "id": "home",
        "title": "Home",
    }


def test_command_search_can_render_hidden_mount(monkeypatch):
    calls = []

    def renderer(**kwargs):
        calls.append(kwargs)
        return object()

    monkeypatch.setattr(_component, "_get_component_renderer", lambda: renderer)

    selected = command_search(
        [{"id": "home", "title": "Home"}],
        show_shortcut_hint=False,
    )

    assert selected is None
    assert calls[0]["height"] == 0
    assert calls[0]["data"]["showShortcutHint"] is False


def test_command_search_validates_numeric_options():
    with pytest.raises(CommandSearchError):
        command_search([{"id": "home", "title": "Home"}], max_results=0)

    with pytest.raises(CommandSearchError):
        command_search([{"id": "home", "title": "Home"}], min_query_length=-1)
