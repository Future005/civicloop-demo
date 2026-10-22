// ============================================================
//  CivicLoop — app.js
//  Mobile-first civic issue reporter
// ============================================================

'use strict';

// ── Constants ──────────────────────────────────────────────
const STORAGE_KEY = 'civicloop_reports';

const CATEGORIES = [
  { id: 'streetlight', label: 'Streetlight', emoji: '💡' },
  { id: 'garbage',     label: 'Garbage',     emoji: '🗑️' },
  { id: 'pothole',     label: 'Pothole',     emoji: '🕳️' },
  { id: 'water',       label: 'Water',       emoji: '💧' },
];

// ── State ───────────────────────────────────────────────────
let state = {
  currentScreen: 'home',   // 'home' | 'report' | 'confirm'
  selectedCategory: null,
  photoDataUrl: null,
  locationText: '',
  locationCoords: null,
  currentReportId: null,
};

// ── LocalStorage helpers ────────────────────────────────────
function getReports() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveReport(report) {
  const reports = getReports();
  reports.unshift(report);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function generateRefNumber() {
  const prefix = 'CL';
  const date   = new Date().toISOString().slice(2,10).replace(/-/g,'');
  const rand   = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${rand}`;
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Screen navigation ───────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) {
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  state.currentScreen = name;
}

// ── Toast helper ────────────────────────────────────────────
let toastTimer;
function showToast(msg, emoji = 'ℹ️') {
  const t = document.getElementById('toast');
  t.innerHTML = `${emoji} ${msg}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── HOME screen ─────────────────────────────────────────────
function renderHome() {
  const reports = getReports();

  // Update stats
  document.getElementById('stat-total').textContent   = reports.length;
  document.getElementById('stat-received').textContent = reports.filter(r => r.status === 'Received').length;
  document.getElementById('stat-resolved').textContent = reports.filter(r => r.status === 'Resolved').length;

  // Render report list
  const listEl = document.getElementById('reports-list');
  if (reports.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state" aria-live="polite">
        <div class="empty-emoji">📋</div>
        <h3>No reports yet</h3>
        <p>Tap 'Report an Issue' to submit<br>your first civic complaint.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = reports.map(r => {
    const cat = CATEGORIES.find(c => c.id === r.category) || { emoji: '📍', label: r.category };
    const badgeClass = {
      'Received': 'badge-received',
      'In Progress': 'badge-progress',
      'Resolved': 'badge-resolved',
    }[r.status] || 'badge-received';

    return `
    <button class="report-card" aria-label="Report: ${cat.label}, ${r.description}" tabindex="0">
      <div class="card-icon" aria-hidden="true">${cat.emoji}</div>
      <div class="card-body">
        <div class="card-top">
          <span class="card-category">${cat.label}</span>
          <span class="card-time">${timeAgo(r.createdAt)}</span>
        </div>
        <div class="card-desc">${escHtml(r.description)}</div>
        <div class="card-footer">
          <span class="card-location">📍 ${escHtml(r.location.substring(0, 38))}${r.location.length > 38 ? '…' : ''}</span>
          <span class="badge ${badgeClass}">${r.status}</span>
        </div>
      </div>
    </button>`;
  }).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── REPORT form reset & show ────────────────────────────────
function startReport() {
  // Reset state
  state.selectedCategory = null;
  state.photoDataUrl = null;
  state.locationText = '';
  state.locationCoords = null;

  // Reset UI
  document.getElementById('desc-input').value = '';
  document.getElementById('location-input').value = '';
  document.getElementById('location-status').textContent = '';
  document.getElementById('location-status').className = 'location-status';
  document.getElementById('photo-preview-wrap').style.display = 'none';
  document.getElementById('photo-preview-img').src = '';
  document.getElementById('upload-area').style.display = '';

  // Reset category buttons
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));

  // Reset progress bar
  setProgress(1);

  showScreen('report');
}

// ── Category selection ──────────────────────────────────────
function selectCategory(id) {
  state.selectedCategory = id;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.catId === id);
    b.setAttribute('aria-pressed', b.dataset.catId === id ? 'true' : 'false');
  });
  setProgress(2);
}

// ── Progress bar ────────────────────────────────────────────
function setProgress(step) {
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 < step)  s.classList.add('done');
    if (i + 1 === step) s.classList.add('active');
  });
}

// ── Photo handling ──────────────────────────────────────────
function handlePhotoChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    showToast('Photo must be under 8 MB', '⚠️'); return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    state.photoDataUrl = ev.target.result;
    document.getElementById('photo-preview-img').src = ev.target.result;
    document.getElementById('photo-preview-wrap').style.display = 'block';
    document.getElementById('upload-area').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  state.photoDataUrl = null;
  document.getElementById('photo-preview-img').src = '';
  document.getElementById('photo-preview-wrap').style.display = 'none';
  document.getElementById('upload-area').style.display = '';
  document.getElementById('photo-input').value = '';
}

// ── Geolocation ─────────────────────────────────────────────
function useMyLocation() {
  const btn = document.getElementById('locate-btn');
  const statusEl = document.getElementById('location-status');
  const inputEl  = document.getElementById('location-input');

  if (!navigator.geolocation) {
    showToast('Geolocation not supported on this browser', '❌');
    return;
  }

  btn.classList.add('loading');
  btn.innerHTML = `<span class="spinner"></span> Locating…`;
  statusEl.textContent = '';
  statusEl.className = 'location-status';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      state.locationCoords = { latitude, longitude };

      // Reverse-geocode using public Nominatim API
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const addr = data.address;
        // Build a friendly label
        const parts = [
          addr.road || addr.pedestrian || addr.neighbourhood,
          addr.suburb || addr.village,
          addr.city || addr.town || addr.county,
        ].filter(Boolean);
        state.locationText = parts.join(', ') || data.display_name.split(',').slice(0,3).join(',').trim();
      } catch {
        // Fallback: show raw coordinates
        state.locationText = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      }

      inputEl.value = state.locationText;
      statusEl.textContent = '✅ Location detected';
      statusEl.className = 'location-status';

      btn.classList.remove('loading');
      btn.innerHTML = `📍 My Location`;
      setProgress(3);
    },
    (err) => {
      const msg = err.code === 1 ? 'Permission denied — please type your address.'
                : err.code === 2 ? 'Location unavailable. Please type your address.'
                : 'Location timed out. Please type your address.';
      statusEl.textContent = `⚠️ ${msg}`;
      statusEl.className = 'location-status error';
      btn.classList.remove('loading');
      btn.innerHTML = `📍 My Location`;
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// ── Form submission ─────────────────────────────────────────
function submitReport(e) {
  e.preventDefault();

  const description = document.getElementById('desc-input').value.trim();
  const location    = document.getElementById('location-input').value.trim();

  // ── Validation ─────────────────────────────────────────
  if (!state.selectedCategory) {
    showToast('Please choose a category', '⚠️');
    document.querySelector('.category-grid').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (!description) {
    showToast('Please add a short description', '⚠️');
    document.getElementById('desc-input').focus();
    return;
  }
  if (!location) {
    showToast('Please add or detect a location', '⚠️');
    document.getElementById('location-input').focus();
    return;
  }

  // ── Build report object ────────────────────────────────
  const refNumber = generateRefNumber();
  const report = {
    id:           refNumber,
    refNumber,
    category:     state.selectedCategory,
    description,
    location,
    locationCoords: state.locationCoords,
    photo:        state.photoDataUrl,
    status:       'Received',
    createdAt:    new Date().toISOString(),
  };

  saveReport(report);
  state.currentReportId = refNumber;

  // ── Render confirmation ────────────────────────────────
  const cat = CATEGORIES.find(c => c.id === state.selectedCategory);
  document.getElementById('confirm-ref').textContent   = refNumber;
  document.getElementById('confirm-cat').textContent   = `${cat.emoji} ${cat.label}`;
  document.getElementById('confirm-desc').textContent  = description;
  document.getElementById('confirm-loc').textContent   = location;
  document.getElementById('confirm-time').textContent  = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  showScreen('confirm');
  setProgress(3); // not visible on confirm, but keeping state
}

// ── Event Binding ────────────────────────────────────────────
function bindEvents() {
  // Home → report
  document.getElementById('btn-report-issue').addEventListener('click', () => {
    startReport();
  });

  // Back buttons
  document.querySelectorAll('[data-go-home]').forEach(btn => {
    btn.addEventListener('click', () => {
      renderHome();
      showScreen('home');
    });
  });

  // Category buttons
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => selectCategory(btn.dataset.catId));
    // Also allow keyboard: space/enter
    btn.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectCategory(btn.dataset.catId); }
    });
  });

  // Description typing → update progress
  document.getElementById('desc-input').addEventListener('input', function() {
    if (state.selectedCategory && this.value.trim().length > 0) setProgress(3);
  });

  // Locate me
  document.getElementById('locate-btn').addEventListener('click', useMyLocation);

  // Manual location typing
  document.getElementById('location-input').addEventListener('input', function() {
    state.locationText  = this.value.trim();
    state.locationCoords = null;
  });

  // Photo
  document.getElementById('photo-input').addEventListener('change', handlePhotoChange);
  document.getElementById('remove-photo-btn').addEventListener('click', removePhoto);

  // Form submit
  document.getElementById('report-form').addEventListener('submit', submitReport);

  // Confirm → home
  document.getElementById('btn-new-report').addEventListener('click', () => {
    startReport();
  });
}

// ── Init ─────────────────────────────────────────────────────
function init() {
  bindEvents();
  renderHome();
  showScreen('home');
}

document.addEventListener('DOMContentLoaded', init);
