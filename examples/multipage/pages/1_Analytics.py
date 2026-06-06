import streamlit as st
from palette import render_palette

st.set_page_config(page_title="Analytics", page_icon="K")
render_palette()

st.title("Analytics")
st.line_chart({"Revenue": [120, 132, 141, 156], "Pipeline": [80, 96, 122, 138]})
