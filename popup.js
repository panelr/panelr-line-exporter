let selectedPanelKey = '';

const panelSelect  = document.getElementById('panel-select');
const btnExtract   = document.getElementById('btn-extract');
const setupHint    = document.getElementById('setup-hint');
const progressFill = document.getElementById('progress-fill');
const progressLabel= document.getElementById('progress-label');
const doneMsgEl    = document.getElementById('done-msg');
const btnOpenReview= document.getElementById('btn-open-review');

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

const whmcsFields = document.getElementById('whmcs-fields');
const whmcsUrl    = document.getElementById('whmcs-url');
const whmcsId     = document.getElementById('whmcs-id');
const whmcsSecret = document.getElementById('whmcs-secret');

function whmcsReady() {
  return whmcsUrl.value.trim() !== '' && whmcsId.value.trim() !== '' && whmcsSecret.value.trim() !== '';
}

panelSelect.addEventListener('change', async () => {
  selectedPanelKey = panelSelect.value;
  const isWhmcs = selectedPanelKey === 'whmcs';
  whmcsFields.style.display = isWhmcs ? 'block' : 'none';
  setupHint.style.display = selectedPanelKey && !isWhmcs ? 'block' : 'none';
  btnExtract.textContent = isWhmcs ? 'Export from WHMCS' : 'Extract Lines';
  if (isWhmcs && whmcsUrl.value.trim() === '') {
    // The WHMCS folder is whatever comes before /admin in the open tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && /^https?:/.test(tab.url)) {
      const m = tab.url.match(/^(https?:\/\/[^?#]*?)\/admin(\/|$)/);
      whmcsUrl.value = m ? m[1] : new URL(tab.url).origin;
    }
  }
  btnExtract.disabled = isWhmcs ? !whmcsReady() : !selectedPanelKey;
});
[whmcsUrl, whmcsId, whmcsSecret].forEach(el => el.addEventListener('input', () => { btnExtract.disabled = !whmcsReady(); }));

btnExtract.addEventListener('click', () => selectedPanelKey === 'whmcs' ? startWhmcsExport() : startExtraction());

async function startWhmcsExport() {
  showScreen('extracting');
  document.querySelector('#screen-extracting .alert-warn').textContent = 'Keep this window open while WHMCS is read.';
  progressFill.style.width = '15%';
  progressLabel.textContent = 'Asking for permission to reach WHMCS…';
  try {
    const base   = whmcsUrl.value.trim().replace(/\/+$/, '');
    const origin = new URL(base).origin + '/*';
    const ok = await chrome.permissions.request({ origins: [origin] });
    if (!ok) throw new Error('Without permission to reach ' + origin + ' nothing can be read.');
    const data = await whmcsExport(base, whmcsId.value.trim(), whmcsSecret.value.trim(), (msg) => { progressLabel.textContent = msg; });
    progressFill.style.width = '100%';
    const json = JSON.stringify(data, null, 1);
    await chrome.downloads.download({
      url: 'data:application/json;charset=utf-8,' + encodeURIComponent(json),
      filename: 'panelr-whmcs-migration.json',
      saveAs: true,
    });
    const noHash = data.clients.length - data.hashes;
    doneMsgEl.innerHTML = '<strong>' + data.clients.length + ' customers and ' + data.services.length + ' services exported.</strong> '
      + (noHash > 0 ? noHash + ' customer' + (noHash === 1 ? '' : 's') + ' came without a login hash; Panelr can email them a link to choose a password. ' : 'Every customer keeps their password. ')
      + 'In Panelr, open Settings → Panel Plugin → Import Lines → Migrate from WHMCS and upload the file.';
    btnOpenReview.style.display = 'none';
    showScreen('done');
  } catch (e) {
    progressLabel.textContent = 'Error: ' + e.message;
    progressFill.style.background = '#ef4444';
    progressFill.style.width = '100%';
  }
}

btnOpenReview.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('review.html') });
});

async function startExtraction() {
  const panel = PANELS[selectedPanelKey];
  if (!panel) return;

  showScreen('extracting');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Detect correct page
  const detected = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: panel.detect,
  });

  if (!detected[0]?.result) {
    progressLabel.textContent = 'Error: Lines table not found. Go to the Lines page first.';
    progressFill.style.background = '#ef4444';
    progressFill.style.width = '100%';
    return;
  }

  // Get total
  const totalResult = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: panel.getTotal,
  });
  const total = totalResult[0]?.result || null;

let allRows = [];
  let pageNum = 1;
  const seenUsernames = new Set();

while (true) {
    const pageResult = await chrome.scripting.executeScript({

      target: { tabId: tab.id },
      func: panel.extractPage,
    });

    const pageRows = pageResult[0]?.result || [];
    if (pageRows.length === 0) break;

    // Wraparound / duplicate detection — stop if all rows on this page already seen
    const newRows = pageRows.filter(r => !seenUsernames.has(r.username));
    if (newRows.length === 0) break;
    newRows.forEach(r => seenUsernames.add(r.username));
    allRows = allRows.concat(newRows);

    const pct = total ? Math.min(Math.round((allRows.length / total) * 100), 100) : null;
    progressFill.style.width = (pct || Math.min(pageNum * 10, 90)) + '%';
    progressLabel.textContent = total
      ? `${allRows.length} of ${total} lines extracted…`
      : `${allRows.length} lines extracted (page ${pageNum})…`;

    // Stop if we've reached the total
    if (total && allRows.length >= total) break;

    const nextResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: panel.nextPage,
    });

 if (!nextResult[0]?.result) break;

    pageNum++;
    if (pageNum > 500) break;

    // Wait until the active page number changes before extracting
    const expectedPage = pageNum;
    let waited = 0;
    while (waited < 5000) {
      await sleep(300);
      waited += 300;
      const activeCheck = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function() {
          const a = document.querySelector('#datatable-users_paginate .paginate_button.active a');
          return a ? parseInt(a.innerText.trim()) : null;
        }
      });
      if (activeCheck[0]?.result === expectedPage) break;
    }
  }

  progressFill.style.width = '100%';

  // Save to storage for review tab
  await chrome.storage.local.set({
    panelr_rows: allRows,
    panelr_panel: selectedPanelKey,
  });

  doneMsgEl.innerHTML = `<strong>${allRows.length} lines extracted.</strong> Click below to review and export.`;
  showScreen('done');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
