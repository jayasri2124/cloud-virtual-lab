#!/bin/bash
# ============================================================
#   Start Backend + Frontend Together
# ============================================================

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Starting Cloud Virtual Coding Lab          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Start backend in background
echo "🚀 Starting FastAPI Backend on http://localhost:8000 ..."
cd backend
source venv/bin/activate 2>/dev/null || true
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo ""
echo "🌐 Starting React Frontend on http://localhost:3000 ..."
cd frontend
npm start &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Both servers running!"
echo "  🌐 Frontend  → http://localhost:3000"
echo "  ⚙️  Backend   → http://localhost:8000"
echo "  📖 API Docs  → http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait and handle exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'Servers stopped.'; exit 0" INT
wait
