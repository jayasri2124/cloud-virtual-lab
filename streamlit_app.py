import streamlit as st
import requests
import json

API = "https://cloudlab-backend.onrender.com/api"
# For local testing use: API = "http://localhost:8000/api"

st.set_page_config(page_title="Cloud Coding Lab", page_icon="🎓", layout="wide")

# ── Session state ──
if "user" not in st.session_state:
    st.session_state.user = None
if "user_type" not in st.session_state:
    st.session_state.user_type = None

# ── Login Page ──
if not st.session_state.user:
    st.title("🎓 Cloud Virtual Coding Lab")
    st.markdown("**Pondicherry University B.Tech CSE**")

    tab1, tab2 = st.tabs(["👤 Student Login", "🔐 Admin Login"])

    with tab1:
        name  = st.text_input("Student Name", placeholder="e.g. Jayasri")
        email = st.text_input("Email ID", placeholder="jay21@gmail.com")
        if st.button("Login as Student", type="primary"):
            try:
                r = requests.post(f"{API}/student/login", json={"name":name,"email":email})
                if r.status_code == 200:
                    st.session_state.user = r.json()["student"]
                    st.session_state.user_type = "student"
                    st.rerun()
                else:
                    st.error("Invalid credentials")
            except:
                st.error("Cannot connect to backend")
        st.info("Demo: Name = Jayasri | Email = jay21@gmail.com")

    with tab2:
        uname = st.text_input("Username", placeholder="admin")
        pwd   = st.text_input("Password", type="password")
        if st.button("Login as Admin", type="primary"):
            try:
                r = requests.post(f"{API}/admin/login", json={"username":uname,"password":pwd})
                if r.status_code == 200:
                    st.session_state.user = r.json()["admin"]
                    st.session_state.user_type = "admin"
                    st.rerun()
                else:
                    st.error("Invalid credentials")
            except:
                st.error("Cannot connect to backend")
        st.info("Demo: Username = admin | Password = admin123")

# ── Student Dashboard ──
elif st.session_state.user_type == "student":
    student = st.session_state.user
    col1, col2 = st.columns([4,1])
    with col1:
        st.title(f"Welcome, {student['name']} 👋")
    with col2:
        if st.button("Logout"):
            st.session_state.user = None
            st.session_state.user_type = None
            st.rerun()

    page = st.sidebar.radio("Navigation", ["💻 Code Editor", "📚 Courses", "📋 History"])

    if page == "💻 Code Editor":
        st.subheader("💻 Code Editor")
        lang = st.selectbox("Language", ["python","c","cpp","java"])
        code = st.text_area("Write your code here", height=300,
                            value='print("Hello, World!")' if lang=="python" else 'int main(){return 0;}')
        if st.button("▶ Run Code", type="primary"):
            with st.spinner("Executing..."):
                try:
                    r = requests.post(f"{API}/execute", json={"student_id":student["id"],"language":lang,"code":code})
                    result = r.json()
                    if result["status"] == "success":
                        st.success(f"✅ Success ({result['execution_time']}s)")
                        st.code(result["output"])
                    else:
                        st.error("Execution Error")
                        st.code(result["output"])
                except:
                    st.error("Backend error")

    elif page == "📚 Courses":
        st.subheader("📚 Lab Syllabus")
        sem = st.selectbox("Select Semester", [1,3,4,5,6,7,8])
        try:
            r = requests.get(f"{API}/syllabus/{sem}")
            if r.status_code == 200:
                lab = r.json()
                st.info(f"**{lab['lab']}** — Language: {lab['language'].upper()}")
                for ex in lab["exercises"]:
                    with st.expander(f"Ex {ex['id']}: {ex['title']}"):
                        st.write(ex["desc"])
                        st.caption(f"💡 Hint: {ex['hint']}")
                        st.write("**Test Cases:**")
                        for i,tc in enumerate(ex["testcases"]):
                            st.code(f"Input:    {tc['input']}\nExpected: {tc['expected']}")
        except:
            st.warning("No lab found for this semester")

    elif page == "📋 History":
        st.subheader("📋 Submission History")
        try:
            r = requests.get(f"{API}/submissions/{student['id']}")
            subs = r.json()
            if not subs:
                st.info("No submissions yet. Start coding!")
            for s in subs:
                color = "green" if s["status"]=="success" else "red"
                st.markdown(f"**{s['language'].upper()}** — :{color}[{s['status']}] — {s['submitted_at'][:16]}")
                with st.expander("View Code & Output"):
                    st.code(s["code"], language=s["language"])
                    st.text(s["output"])
        except:
            st.error("Cannot load history")

# ── Admin Dashboard ──
elif st.session_state.user_type == "admin":
    col1, col2 = st.columns([4,1])
    with col1:
        st.title("🛡️ Admin Dashboard")
    with col2:
        if st.button("Logout"):
            st.session_state.user = None
            st.session_state.user_type = None
            st.rerun()

    page = st.sidebar.radio("Navigation", ["📊 Overview", "👥 Students", "📈 Analytics"])

    if page == "📊 Overview":
        try:
            r = requests.get(f"{API}/analytics").json()
            col1,col2,col3,col4 = st.columns(4)
            col1.metric("Total Students", r["total_students"])
            col2.metric("Total Submissions", r["total_submissions"])
            col3.metric("Success Rate", f"{r['success_rate']}%")
            col4.metric("Active Sessions", r["active_sessions"])
        except:
            st.error("Cannot load analytics")

    elif page == "👥 Students":
        st.subheader("Student Management")
        try:
            students = requests.get(f"{API}/students").json()
            for s in students:
                col1,col2,col3 = st.columns([3,2,1])
                col1.write(f"**{s['name']}** — {s['register_number']}")
                col2.write(s["email"])
                col3.write(f"Sem {s['semester']}")
        except:
            st.error("Cannot load students")

    elif page == "📈 Analytics":
        try:
            r = requests.get(f"{API}/analytics").json()
            if r["language_stats"]:
                import pandas as pd
                df = pd.DataFrame(r["language_stats"])
                st.bar_chart(df.set_index("language"))
        except:
            st.error("Cannot load analytics")