import streamlit as st

from streamlit_command_palette import command_palette, dataframe_items

st.set_page_config(page_title="Command Palette DataFrame", page_icon="K", layout="wide")

rows = [
    {
        "customer_id": "C-1001",
        "customer_name": "Northstar Labs",
        "segment": "Enterprise",
        "region": "North America",
        "owner": "Priya",
    },
    {
        "customer_id": "C-1002",
        "customer_name": "Lumen Works",
        "segment": "Mid-market",
        "region": "Europe",
        "owner": "Mateo",
    },
    {
        "customer_id": "C-1003",
        "customer_name": "Harbor Analytics",
        "segment": "Startup",
        "region": "Australia",
        "owner": "Ava",
    },
]

items = dataframe_items(
    rows,
    id_field="customer_id",
    title_field="customer_name",
    subtitle_fields=["segment", "region"],
    group="Customers",
    keywords_fields=["customer_name", "segment", "region", "owner"],
)

selected = command_palette(
    items,
    placeholder="Search customers...",
    groups={"Customers": "Customers"},
    search_fields=["title", "subtitle", "keywords", "metadata.owner"],
    key="customer_search",
)

st.title("DataFrame search")
st.dataframe(rows, use_container_width=True)

if selected:
    st.subheader("Selected customer")
    st.json(selected)
