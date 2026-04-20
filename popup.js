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

panelSelect.addEventListener('change', () => {
  selectedPanelKey = panelSelect.value;
  btnExtract.disabled = !selectedPanelKey;
  setupHint.style.display = selectedPanelKey ? 'block' : 'none';
});

btnExtract.addEventListener('click', startExtraction);

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
