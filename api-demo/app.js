const API_BASE = '../api';
const categories = [
  ['historical_places', 'Historical Places'],
  ['cultural_heritage', 'Cultural Heritage']
];
const $ = id => document.getElementById(id);
let records = [];
let searchTimer;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function endpoint(table, id, query) {
  const params = new URLSearchParams();
  if (id) params.set('id', id);
  if (query) params.set('q', query);
  const search = params.toString();
  return `${API_BASE}/${table}.php${search ? `?${search}` : ''}`;
}

function setConnection(state, label) {
  $('connectionStatus').dataset.state = state;
  $('connectionLabel').textContent = label;
}

async function requestJson(url) {
  const response = await fetch(url);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The API response was not valid JSON.');
  }
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `The API request failed (${response.status}).`);
  }
  return payload;
}

async function loadRecords() {
  const selectedTable = document.querySelector('.categoryTab.is-active').dataset.table;
  const query = $('searchInput').value.trim();
  const tables = selectedTable
    ? [selectedTable]
    : categories.map(([table]) => table);

  $('recordCount').textContent = 'Loading records…';
  $('loadMessage').textContent = '';

  try {
    const responses = await Promise.all(tables.map(async table => {
      const payload = await requestJson(endpoint(table, null, query));
      if (!Array.isArray(payload.data)) {
        throw new Error(`The ${table} endpoint returned an unexpected data format.`);
      }
      return payload.data.map(record => ({ ...record, _table: table }));
    }));

    records = responses.flat();
    $('recordCount').textContent = `${records.length} ${records.length === 1 ? 'record' : 'records'} loaded`;
    $('loadMessage').textContent = `GET completed · ${tables.length} API ${tables.length === 1 ? 'request' : 'requests'}`;
    setConnection('connected', 'API connected');
    renderRecords();
  } catch (error) {
    records = [];
    $('recordCount').textContent = 'Could not load records';
    $('loadMessage').textContent = error.message;
    $('records').innerHTML = '<div class="errorState">Check that Apache and MySQL are running, then try again.</div>';
    setConnection('error', 'API unavailable');
  }
}

function safeImageUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function renderRecords() {
  if (!records.length) {
    $('records').innerHTML = '<div class="emptyState">No records found. Try another search or category.</div>';
    return;
  }

  $('records').innerHTML = records.map(record => {
    const label = record._table === 'historical_places' ? 'Historical Places' : 'Cultural Heritage';
    const imageUrl = safeImageUrl(record.image_url);
    const image = imageUrl
      ? `<img class="recordImage" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(record.name)}" loading="lazy">`
      : '';

    return `<article class="recordCard">
      ${image}
      <div class="recordBody">
        <span class="recordCategory">${label}</span>
        <h3>${escapeHtml(record.name)}</h3>
        <p>${escapeHtml((record.description || 'No description available.').slice(0, 150))}</p>
        <span class="recordLocation">${escapeHtml(record.municipality || 'Siargao Island')}</span>
        <button type="button" data-action="details" data-table="${record._table}" data-id="${escapeHtml(record.id)}">View API record <span aria-hidden="true">↗</span></button>
      </div>
    </article>`;
  }).join('');
}

async function showRecord(table, id) {
  $('recordDetails').innerHTML = '<p class="detailMeta">Requesting record from the API…</p>';
  $('detailDialog').showModal();

  try {
    const payload = await requestJson(endpoint(table, id));
    const record = payload.data;
    const cultural = table === 'cultural_heritage';
    const label = cultural ? 'Cultural Heritage' : 'Historical Places';
    const detailLabel = cultural ? 'Community practice' : 'Historical significance';
    const detail = cultural ? record.community_practice : record.historical_significance;
    const imageUrl = safeImageUrl(record.image_url);
    const image = imageUrl
      ? `<img class="detailImage" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(record.name)}">`
      : '';
    const heritageCategory = cultural && record.category
      ? `<p class="detailMeta">Heritage category: ${escapeHtml(record.category)}</p>`
      : '';

    $('recordDetails').innerHTML = `<p class="detailEyebrow">GET /api/${table}.php?id=${encodeURIComponent(id)}</p>
      <h2 id="detailTitle" class="detailTitle">${escapeHtml(record.name)}</h2>
      <p class="detailMeta">${label} · ${escapeHtml(record.municipality || 'Siargao Island')}</p>
      ${image}${heritageCategory}
      <p class="detailText">${escapeHtml(record.description)}</p>
      <h3>${detailLabel}</h3>
      <p class="detailText">${escapeHtml(detail || 'No additional details provided.')}</p>
      <details class="rawResponse">
        <summary>Inspect raw JSON response</summary>
        <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
      </details>`;
  } catch (error) {
    $('recordDetails').innerHTML = `<p class="detailEyebrow">API request failed</p><h2 id="detailTitle" class="detailTitle">Could not load record</h2><p class="detailText">${escapeHtml(error.message)}</p>`;
  }
}

document.querySelector('.categoryTabs').addEventListener('click', event => {
  const button = event.target.closest('.categoryTab');
  if (!button || button.classList.contains('is-active')) return;

  document.querySelectorAll('.categoryTab').forEach(tab => {
    const active = tab === button;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  loadRecords();
});

$('searchInput').addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(loadRecords, 250);
});

$('records').addEventListener('click', event => {
  const button = event.target.closest('button[data-action="details"]');
  if (!button) return;
  showRecord(button.dataset.table, button.dataset.id);
});

$('closeDetails').addEventListener('click', () => $('detailDialog').close());
$('detailDialog').addEventListener('click', event => {
  if (event.target === $('detailDialog')) $('detailDialog').close();
});

loadRecords();
