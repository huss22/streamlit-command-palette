import streamlit as st
from palette import render_palette

st.set_page_config(page_title="Settings", page_icon="K")
render_palette()

st.title("Settings")
st.toggle("Enable compact results", value=True)
st.selectbox("Default group", ["Pages", "Actions", "Customers"])
