const API = 'api';
const $ = id => document.getElementById(id);
const categories = [
  ['historical_places', 'Historical Places'],
  ['cultural_heritage', 'Cultural Heritage']
];
let rows = [];

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function endpoint(table, id) {
  return `${API}/${table}.php${id ? `?id=${encodeURIComponent(id)}` : ''}`;
}

function setup() {
  $('filter').innerHTML = '<option value="">All categories</option>' +
    categories.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  $('category').innerHTML = categories
    .map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  updateFormFields();
}

async function load() {
  $('status').textContent = 'Loading...';
  const selectedTable = $('filter').value;
  const query = $('search').value.trim();
  const tables = selectedTable ? [selectedTable] : categories.map(([table]) => table);

  try {
    const results = await Promise.all(tables.map(async table => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      const queryString = params.toString();
      const response = await fetch(`${endpoint(table)}${queryString ? `?${queryString}` : ''}`);
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Unable to load records.');
      return json.data.map(record => ({ ...record, _table: table }));
    }));

    rows = results.flat();
    $('status').textContent = `${rows.length} record(s)`;
    render();
  } catch (error) {
    $('status').textContent = error.message;
    $('records').innerHTML = '<div class="empty">Cannot connect to API. Check XAMPP and database setup.</div>';
  }
}

function render() {
  if (!rows.length) {
    $('records').innerHTML = '<div class="empty">No records match your search.</div>';
    return;
  }

  $('records').innerHTML = rows.map(record => {
    const title = record.name;
    const image = record.image_url
      ? `<img src="${esc(record.image_url)}" alt="${esc(title)}">`
      : '';
    const kind = record._table === 'historical_places' ? 'Historical Places' : 'Cultural Heritage';

    return `<article class="card">${image}<div class="cardBody">
      <small>${kind} · ${esc(record.municipality || 'Siargao')}</small>
      <h3>${esc(title)}</h3>
      <p>${esc((record.description || 'No description.').slice(0, 130))}</p>
      <p>Status: ${esc(record.verification_status)}</p>
      <div class="actions">
        <button onclick="view('${record._table}', ${record.id})">View</button>
        <button class="muted" onclick="edit('${record._table}', ${record.id})">Edit</button>
        <button class="muted" onclick="removeRecord('${record._table}', ${record.id})">Delete</button>
      </div>
    </div></article>`;
  }).join('');
}

function updateFormFields() {
  const historical = $('category').value === 'historical_places';
  $('specificInfoLabel').textContent = historical ? 'Historical significance' : 'Community practice';
}

function formValues() {
  const historical = $('category').value === 'historical_places';
  const values = {
    name: $('title').value.trim(),
    municipality: $('municipality').value.trim() || null,
    description: $('description').value.trim(),
    image_url: $('image').value.trim() || null,
    source_reference: $('source').value.trim(),
    verification_status: 'online_source_based'
  };
  if (historical) {
    values.historical_significance = $('specificInfo').value.trim();
  } else {
    values.category = $('heritageCategory').value || 'Cultural Heritage';
    values.community_practice = $('specificInfo').value.trim();
  }
  return values;
}

function clearForm() {
  $('recordForm').reset();
  $('rid').value = '';
  $('category').value = categories[0][0];
  $('heritageCategory').value = '';
  $('formTitle').textContent = 'Add a record';
  updateFormFields();
}

$('addBtn').onclick = () => {
  clearForm();
  $('formDialog').showModal();
};
$('close').onclick = $('cancel').onclick = () => $('formDialog').close();
$('detailClose').onclick = () => $('detailDialog').close();
$('search').oninput = load;
$('filter').onchange = load;
$('category').onchange = updateFormFields;

$('recordForm').onsubmit = async event => {
  event.preventDefault();
  const id = $('rid').value;
  const table = $('category').value;
  const url = endpoint(table, id);

  try {
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formValues())
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'Unable to save record.');
    $('formDialog').close();
    clearForm();
    await load();
    alert(json.message);
  } catch (error) {
    alert(error.message);
  }
};

window.view = async (table, id) => {
  try {
    const response = await fetch(endpoint(table, id));
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'Unable to load record.');
    const record = json.data;
    const historical = table === 'historical_places';
    const categoryName = historical ? 'Historical Places' : 'Cultural Heritage';
    const extraLabel = historical ? 'Historical significance' : 'Community practice';
    const extraValue = historical ? record.historical_significance : record.community_practice;
    const image = record.image_url ? `<img style="width:100%;max-height:260px;object-fit:cover" src="${esc(record.image_url)}" alt="${esc(record.name)}">` : '';
    const source = record.source_reference
      ? `<a href="${esc(record.source_reference)}" target="_blank" rel="noopener noreferrer">Source reference</a>`
      : '';

    $('detail').innerHTML = `<h2>${esc(record.name)}</h2>
      <p>${categoryName} · ${esc(record.municipality || 'Siargao')}</p>${image}
      <p>${esc(record.description)}</p><h3>${extraLabel}</h3>
      <p>${esc(extraValue || '')}</p><p>${source}</p>
      <p>Status: ${esc(record.verification_status)}</p>`;
    $('detailDialog').showModal();
  } catch (error) {
    alert(error.message);
  }
};

window.edit = (table, id) => {
  const record = rows.find(item => item._table === table && Number(item.id) === Number(id));
  if (!record) return;

  $('rid').value = record.id;
  $('category').value = table;
  $('title').value = record.name || '';
  $('municipality').value = record.municipality || '';
  $('description').value = record.description || '';
  $('specificInfo').value = table === 'historical_places'
    ? record.historical_significance || ''
    : record.community_practice || '';
  $('heritageCategory').value = record.category || '';
  $('image').value = record.image_url || '';
  $('source').value = record.source_reference || '';
  $('formTitle').textContent = 'Edit record';
  updateFormFields();
  $('formDialog').showModal();
};

window.removeRecord = async (table, id) => {
  if (!confirm('Delete this record?')) return;
  try {
    const response = await fetch(endpoint(table, id), { method: 'DELETE' });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'Unable to delete record.');
    alert(json.message);
    await load();
  } catch (error) {
    alert(error.message);
  }
};

setup();
load();
