// ── CENTRAL API CONFIGURATION ─────────────────────────────────────────────────
// This file is imported by ALL pages instead of hardcoding localhost
//
// On Render.com:  Set environment variable REACT_APP_API_URL in the frontend
//                 Static Site settings to your backend URL like:
//                 https://cloud-virtual-lab-backend.onrender.com/api
//
// Locally:        Falls back to http://localhost:8000/api automatically

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default API;
