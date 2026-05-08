#!/bin/bash
# ============================================================
#   Cloud-Powered Virtual Coding Lab - Full Setup Script
# ============================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Cloud-Powered Virtual Coding Lab Setup     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Step 1: Backend setup
echo "━━━ Step 1: Setting up Python Backend ━━━"
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # Linux/Mac
# On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

echo "✅ Backend dependencies installed"
cd ..

# Step 2: Frontend setup
echo ""
echo "━━━ Step 2: Setting up React Frontend ━━━"
cd frontend

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js from https://nodejs.org"
    exit 1
fi

npm install
echo "✅ Frontend dependencies installed"
cd ..

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Setup Complete!                         ║"
echo "║                                              ║"
echo "║   Run: bash run.sh                           ║"
echo "╚══════════════════════════════════════════════╝"
