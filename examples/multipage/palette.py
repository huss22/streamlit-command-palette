import streamlit as st

from streamlit_command_palette import action_item, command_palette, page_item


def render_palette():
    items = [
        page_item("home", "Home", subtitle="Executive overview", target="Home.py"),
        page_item(
            "analytics",
            "Analytics",
            subtitle="Charts and diagnostics",
            target="pages/1_Analytics.py",
        ),
        page_item(
            "settings",
            "Settings",
            subtitle="Application preferences",
            target="pages/2_Settings.py",
        ),
        action_item("clear-cache", "Clear cache", subtitle="Clear st.cache_data"),
    ]

    selected = command_palette(
        items,
        placeholder="Go to page or run action...",
        groups=["Pages", "Actions"],
        key="multipage_command_search",
    )

    if not selected:
        return
    if selected["type"] == "page" and selected["target"]:
        st.switch_page(selected["target"])
    elif selected["id"] == "clear-cache":
        st.cache_data.clear()
        st.toast("Cache cleared")
