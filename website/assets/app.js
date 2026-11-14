const API_BASE = '../api';
const $ = id => document.getElementById(id);
const categories = [
  ['historical_places', 'Historical Places'],
  ['cultural_heritage', 'Cultural Heritage']
];
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

function apiUrl(table, id) {
  return `${API_BASE}/${table}.php${id ? `?id=${encodeURIComponent(id)}` : ''}`;
}

function validWebUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The API returned an unreadable response.');
  }
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `Request failed (${response.status}).`);
  }
  return payload;
}

async function loadRecords() {
  $('status').textContent = 'Loading...';
  const selectedTable = $('categoryFilter').value;
  const tables = selectedTable ? [selectedTable] : categories.map(([table]) => table);
  const query = $('searchInput').value.trim();

  try {
    const results = await Promise.all(tables.map(async table => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      const queryString = params.toString();
      const payload = await requestJson(`${apiUrl(table)}${queryString ? `?${queryString}` : ''}`);
      return payload.data.map(record => ({ ...record, _table: table }));
    }));

    records = results.flat();
    $('status').textContent = `${records.length} record(s)`;
    renderRecords();
  } catch (error) {
    $('status').textContent = error.message;
    $('records').innerHTML = '<div class="empty">Cannot connect to API. Check XAMPP and database setup.</div>';
  }
}

function renderRecords() {
  if (!records.length) {
    $('records').innerHTML = '<div class="empty">No records match your search.</div>';
    return;
  }

  $('records').innerHTML = records.map(record => {
    const label = record._table === 'historical_places' ? 'Historical Places' : 'Cultural Heritage';
    const imageUrl = validWebUrl(record.image_url);
    const image = imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(record.name)}">`
      : '';

    return `<article class="card">
      ${image}
      <div class="cardBody">
        <small>${label} · ${escapeHtml(record.municipality || 'Siargao')}</small>
        <h3>${escapeHtml(record.name)}</h3>
        <p>${escapeHtml((record.description || 'No description.').slice(0, 130))}</p>
        <p>Status: ${escapeHtml(record.verification_status)}</p>
        <div class="actions">
          <button type="button" data-action="view" data-table="${record._table}" data-id="${record.id}">View</button>
          <button class="muted" type="button" data-action="edit" data-table="${record._table}" data-id="${record.id}">Edit</button>
          <button class="muted" type="button" data-action="delete" data-table="${record._table}" data-id="${record.id}">Delete</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function updateTypeFields() {
  const cultural = $('recordType').value === 'cultural_heritage';
  $('heritageCategoryField').hidden = !cultural;
  $('heritageCategory').required = cultural;
  $('detailFieldLabel').textContent = cultural ? 'Community practice' : 'Historical significance';
}

function clearForm() {
  $('recordForm').reset();
  $('recordId').value = '';
  $('recordType').value = 'historical_places';
  $('formHeading').textContent = 'Add a record';
  updateTypeFields();
}

function formRecord() {
  const table = $('recordType').value;
  const record = {
    name: $('name').value.trim(),
    municipality: $('municipality').value.trim() || null,
    description: $('description').value.trim(),
    image_url: $('imageUrl').value.trim() || null,
    source_reference: $('sourceReference').value.trim(),
    verification_status: 'online_source_based'
  };

  if (table === 'historical_places') {
    record.historical_significance = $('detailField').value.trim();
  } else {
    record.category = $('heritageCategory').value.trim();
    record.community_practice = $('detailField').value.trim();
  }
  return record;
}

async function saveRecord(event) {
  event.preventDefault();
  const table = $('recordType').value;
  const id = $('recordId').value;

  try {
    const result = await requestJson(apiUrl(table, id), {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formRecord())
    });
    $('recordDialog').close();
    clearForm();
    await loadRecords();
    window.alert(result.message || 'Record saved.');
  } catch (error) {
    window.alert(error.message);
  }
}

async function viewRecord(table, id) {
  try {
    const payload = await requestJson(apiUrl(table, id));
    const record = payload.data;
    const cultural = table === 'cultural_heritage';
    const label = cultural ? 'Cultural Heritage' : 'Historical Places';
    const extraLabel = cultural ? 'Community practice' : 'Historical significance';
    const extraValue = cultural ? record.community_practice : record.historical_significance;
    const imageUrl = validWebUrl(record.image_url);
    const sourceUrl = validWebUrl(record.source_reference);
    const image = imageUrl
      ? `<img style="width:100%;max-height:260px;object-fit:cover" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(record.name)}">`
      : '';
    const category = cultural && record.category
      ? `<p><strong>Heritage category:</strong> ${escapeHtml(record.category)}</p>`
      : '';
    const source = sourceUrl
      ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Source reference</a>`
      : escapeHtml(record.source_reference);

    $('recordDetails').innerHTML = `<h2>${escapeHtml(record.name)}</h2>
      <p>${label} · ${escapeHtml(record.municipality || 'Siargao')}</p>${image}${category}
      <p>${escapeHtml(record.description)}</p>
      <h3>${extraLabel}</h3>
      <p>${escapeHtml(extraValue || '')}</p>
      <p>${source}</p>
      <p>Status: ${escapeHtml(record.verification_status)}</p>`;
    $('detailDialog').showModal();
  } catch (error) {
    window.alert(error.message);
  }
}

function editRecord(table, id) {
  const record = records.find(item => item._table === table && Number(item.id) === Number(id));
  if (!record) return;

  $('recordId').value = record.id;
  $('recordType').value = table;
  $('name').value = record.name || '';
  $('municipality').value = record.municipality || '';
  $('description').value = record.description || '';
  $('detailField').value = table === 'cultural_heritage'
    ? record.community_practice || ''
    : record.historical_significance || '';
  $('heritageCategory').value = record.category || '';
  $('imageUrl').value = record.image_url || '';
  $('sourceReference').value = record.source_reference || '';
  $('formHeading').textContent = 'Edit record';
  updateTypeFields();
  $('recordDialog').showModal();
}

async function deleteRecord(table, id) {
  if (!window.confirm('Delete this record? This cannot be undone.')) return;
  try {
    const result = await requestJson(apiUrl(table, id), { method: 'DELETE' });
    await loadRecords();
    window.alert(result.message || 'Record deleted.');
  } catch (error) {
    window.alert(error.message);
  }
}

$('addButton').addEventListener('click', () => {
  clearForm();
  $('recordDialog').showModal();
});
$('closeFormButton').addEventListener('click', () => $('recordDialog').close());
$('cancelFormButton').addEventListener('click', () => $('recordDialog').close());
$('closeDetailsButton').addEventListener('click', () => $('detailDialog').close());
$('recordType').addEventListener('change', updateTypeFields);
$('recordForm').addEventListener('submit', saveRecord);
$('categoryFilter').addEventListener('change', loadRecords);
$('searchInput').addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(loadRecords, 250);
});
$('records').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, table, id } = button.dataset;
  if (action === 'view') viewRecord(table, id);
  if (action === 'edit') editRecord(table, id);
  if (action === 'delete') deleteRecord(table, id);
});

updateTypeFields();
loadRecords();
