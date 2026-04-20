let allRows = [];
let panelKey = '';

const reviewTbody      = document.getElementById('review-tbody');
const summaryBar       = document.getElementById('summary-bar');
const bulkProductSelect= document.getElementById('bulk-product-select');
const btnExport        = document.getElementById('btn-export');
const btnSkipExpired   = document.getElementById('btn-skip-expired');
const btnBulkAll       = document.getElementById('btn-bulk-all');
const btnBulkActive    = document.getElementById('btn-bulk-active');

// Load data from storage
chrome.storage.local.get(['panelr_rows', 'panelr_panel'], (result) => {
  allRows  = result.panelr_rows  || [];
  panelKey = result.panelr_panel || '';
  const panel = PANELS[panelKey];

  if (!panel || !allRows.length) {
    reviewTbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:#475569;">No data found. Run the extraction first.</td></tr>`;
    return;
  }

  // Populate bulk product dropdown
  bulkProductSelect.innerHTML = `<option value="">— Select product —</option>` +
    panel.products.map(p => `<option value="${p.id}">${p.label}</option>`).join('');

  buildTable(panel);
});

function buildTable(panel) {
  const productOpts = `<option value="">— None —</option>` +
    panel.products.map(p => `<option value="${p.id}">${p.label}</option>`).join('');

  updateSummary();

  reviewTbody.innerHTML = allRows.map((r, i) => `
    <tr>
      <td style="color:#475569;width:36px;">${i + 1}</td>
      <td style="color:#64748b;font-size:11px;">${esc(r.panel_user_id)}</td>
      <td><code style="font-size:11px;color:#94a3b8;">${esc(r.username)}</code></td>
      <td><code style="font-size:11px;color:#94a3b8;">${esc(r.password)}</code></td>
      <td style="white-space:nowrap;">${esc(r.expiration_date)}</td>
      <td><span class="badge badge-${r.status}">${r.status}</span></td>
      <td><input type="text" data-i="${i}" data-f="customer_name" value="${esc(r.customer_name)}"></td>
      <td><input type="text" data-i="${i}" data-f="customer_email" value="${esc(r.customer_email)}"></td>
      <td><input type="text" data-i="${i}" data-f="reseller_notes" value="${esc(r.reseller_notes)}"></td>
      <td>
        <select data-i="${i}" data-f="product_id">
          ${productOpts.replace(`value="${esc(r.product_id)}"`, `value="${esc(r.product_id)}" selected`)}
        </select>
      </td>
    </tr>
  `).join('');

  // Live edit
  reviewTbody.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', () => {
      allRows[parseInt(el.dataset.i)][el.dataset.f] = el.value;
      if (el.dataset.f === 'product_id') return;
    });
  });
}

function updateSummary() {
  const active  = allRows.filter(r => r.status === 'active').length;
  const expired = allRows.filter(r => r.status === 'expired').length;
  summaryBar.innerHTML = `
    <div class="summary-item"><div class="val">${allRows.length}</div><div class="lbl">Total</div></div>
    <div class="summary-item"><div class="val" style="color:#34d399">${active}</div><div class="lbl">Active</div></div>
    <div class="summary-item"><div class="val" style="color:#f87171">${expired}</div><div class="lbl">Expired</div></div>
  `;
}

btnSkipExpired.addEventListener('click', () => {
  allRows = allRows.filter(r => r.status !== 'expired');
  buildTable(PANELS[panelKey]);
});

btnBulkAll.addEventListener('click', () => {
  const val = bulkProductSelect.value;
  if (!val) return;
  allRows.forEach(r => r.product_id = val);
  buildTable(PANELS[panelKey]);
});

btnBulkActive.addEventListener('click', () => {
  const val = bulkProductSelect.value;
  if (!val) return;
  allRows.forEach(r => { if (r.status === 'active') r.product_id = val; });
  buildTable(PANELS[panelKey]);
});

btnExport.addEventListener('click', () => {
  const headers = ['panel_user_id', 'username', 'password', 'expiration_date', 'status', 'customer_name', 'customer_email', 'reseller_notes', 'product_id'];
  const lines = [
    headers.join(','),
    ...allRows.map(r => headers.map(h => csvCell(r[h] || '')).join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'panelr-lines-import.csv';
  a.click();
  URL.revokeObjectURL(url);
});

function csvCell(val) {
  const s = String(val).replace(/"/g, '""');
  return /[,"\n\r]/.test(s) ? `"${s}"` : s;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
