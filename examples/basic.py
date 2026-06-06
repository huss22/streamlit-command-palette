import streamlit as st

from streamlit_command_palette import action_item, command_palette, page_item

st.set_page_config(page_title="Command Palette Basic", page_icon="K", layout="wide")

st.title("Command palette basic example")

items = [
    page_item("home", "Home", subtitle="Dashboard overview", target="home"),
    page_item("reports", "Reports", subtitle="Saved report views", target="reports"),
    page_item(
        "settings",
        "Settings",
        subtitle="Workspace preferences",
        target="settings",
    ),
    action_item("refresh", "Refresh data", subtitle="Clear cache and rerun"),
    action_item("download", "Download report", subtitle="Prepare latest CSV export"),
    {
        "id": "docs",
        "title": "Open documentation",
        "subtitle": "README and usage guide",
        "type": "link",
        "group": "Resources",
        "url": "https://example.com/docs",
        "icon": "link",
        "keywords": ["help", "manual", "reference"],
    },
]

selected = command_palette(
    items,
    placeholder="Search pages, actions, and resources...",
    groups=["Pages", "Actions", "Resources"],
    key="basic_command_search",
)

if selected:
    st.success(f"Selected {selected['title']} ({selected['id']})")
    st.json(selected)

st.info("Use Cmd+K on macOS or Ctrl+K elsewhere.")
