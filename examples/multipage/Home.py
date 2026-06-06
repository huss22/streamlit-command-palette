import streamlit as st
from palette import render_palette

st.set_page_config(page_title="Multipage Command Palette", page_icon="K")
render_palette()

st.title("Home")
st.write("Use Cmd+K on macOS or Ctrl+K elsewhere to navigate this multipage app.")
