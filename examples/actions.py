import streamlit as st

from streamlit_command_palette import action_item, command_palette

st.set_page_config(page_title="Command Palette Actions", page_icon="K")

if "counter" not in st.session_state:
    st.session_state.counter = 0
if "status" not in st.session_state:
    st.session_state.status = "Ready"

items = [
    action_item("increment", "Increment counter", subtitle="Add one to the demo value"),
    action_item("reset", "Reset counter", subtitle="Set the demo value back to zero"),
    action_item(
        "clear-cache",
        "Clear Streamlit cache",
        subtitle="Call st.cache_data.clear",
    ),
    action_item(
        "disabled",
        "Disabled action",
        subtitle="This item is visible but cannot be selected",
        disabled=True,
    ),
]

selected = command_palette(items, placeholder="Run an action...", key="actions_search")

if selected:
    if selected["id"] == "increment":
        st.session_state.counter += 1
        st.session_state.status = "Counter incremented"
    elif selected["id"] == "reset":
        st.session_state.counter = 0
        st.session_state.status = "Counter reset"
    elif selected["id"] == "clear-cache":
        st.cache_data.clear()
        st.session_state.status = "Cache cleared"

st.title("Command actions")
st.metric("Counter", st.session_state.counter)
st.caption(st.session_state.status)
