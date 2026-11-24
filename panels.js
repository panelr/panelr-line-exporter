const PANELS = {
  // Strong8k and the other brands on the same software. Its Lines page and
  // its MAG page are one table (#datatable-users) with the same columns,
  // except the first two: Username and Password on Lines, MAC and SN on MAG.
  // A MAG device has no login, so it is exported by its MAC address.
  strong8k: {
    name: 'Strong8k (my8k.me)',
    products: [
      { id: 'trial',       label: '24hr Free Trial',        duration_months: 0  },
      { id: 'monthly',     label: 'Monthly Connection',     duration_months: 1  },
      { id: 'quarterly',   label: 'Quarterly Connection',   duration_months: 3  },
      { id: 'semi_annual', label: 'Semi-Annual Connection', duration_months: 6  },
      { id: 'annual',      label: 'Annual Connection',      duration_months: 12 },
    ],
    extractPage: function() {
      const firstHeader = (document.querySelector('#datatable-users thead th')?.innerText || '').trim().toUpperCase();
      // The MAG page is known by its first heading; a row whose first cell is
      // a MAC address is a MAG device whatever the heading says
      const magPage = firstHeader.startsWith('MAC');
      const macLike = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
      return Array.from(document.querySelectorAll('#datatable-users tbody tr')).map(tr => {
        const tds = tr.querySelectorAll('td');
        const notes = tds[5]?.innerText?.trim() || '';
        const emailMatch = notes.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        const email = emailMatch ? emailMatch[0] : '';
        // Panelr writes the note as "Name (email)": with the email taken out, the empty brackets go too
        const name = notes.replace(emailMatch ? emailMatch[0] : '', '').replace(/\(User ID:\s*\d+\)/i, '').replace(/\(\s*\)/g, '').trim().split('\n')[0].trim();
        const statusText = tds[7]?.querySelector('.badge')?.innerText?.trim() || '';
        const status = statusText === 'Yes' ? 'active' : (statusText === 'Expired' ? 'expired' : 'disabled');
        const linkDropdown = tds[2]?.innerHTML || '';
        const apiMatch = linkDropdown.match(/api\('(\d+)'/);
        const panelUserId = apiMatch ? apiMatch[1] : '';
        const first = tds[0]?.innerText?.trim() || '';
        const isMag = magPage || macLike.test(first);
        return {
          panel_user_id:   panelUserId,
          username:        isMag ? '' : first,
          password:        isMag ? '' : (tds[1]?.innerText?.trim() || ''),
          mac_address:     isMag ? first.toUpperCase() : '',
          expiration_date: tds[3]?.innerText?.trim() || '',
          customer_name:   name,
          customer_email:  email,
          reseller_notes:  notes,
          status:          status,
          product_id:      '',
        };
      }).filter(r => r.username || /^([0-9A-F]{2}[:-]?){5}[0-9A-F]{2}$/.test(r.mac_address));
    },
    nextPage: function() {
      const next = document.querySelector('#datatable-users_next:not(.disabled) a, #datatable-users_next:not(.disabled)');
      if (next) { next.click(); return true; }
      return false;
    },
    detect: function() {
      return !!document.querySelector('#datatable-users');
    },
    getTotal: function() {
      const info = document.querySelector('#datatable-users_info');
      if (!info) return null;
      const match = info.innerText.match(/of\s+([\d,]+)/i);
      return match ? parseInt(match[1].replace(',', '')) : null;
    }
  },

  trex: {
    name: 'T-Rex',
    products: [
      { id: 'trial',       label: '24hr Free Trial',        duration_months: 0  },
      { id: 'monthly',     label: 'Monthly Connection',     duration_months: 1  },
      { id: 'quarterly',   label: 'Quarterly Connection',   duration_months: 3  },
      { id: 'semi_annual', label: 'Semi-Annual Connection', duration_months: 6  },
      { id: 'annual',      label: 'Annual Connection',      duration_months: 12 },
    ],
    extractPage: function() {
      return Array.from(document.querySelectorAll('#datatable-users tbody tr')).map(tr => {
        const tds = tr.querySelectorAll('td');
        const statusBadge = tds[0]?.querySelector('.badge');
        const statusClass = statusBadge?.className || '';
        const status = statusClass.includes('success') ? 'active'
                     : statusClass.includes('warning') ? 'expired'
                     : 'disabled';
        const notes = tds[10]?.innerText?.trim() || '';
        const emailMatch = notes.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        const email = emailMatch ? emailMatch[0] : '';
        const name = notes.replace(emailMatch ? emailMatch[0] : '', '').replace(/\(\s*\)/g, '').trim().split('\n')[0].trim();
        const actionHtml = tds[12]?.innerHTML || '';
        const apiMatch = actionHtml.match(/api\((\d+),/);
        const panelUserId = apiMatch ? apiMatch[1] : '';
        return {
          panel_user_id:   panelUserId,
          username:        tds[1]?.innerText?.trim() || '',
          password:        tds[2]?.innerText?.trim() || '',
          expiration_date: tds[3]?.innerText?.trim() || '',
          customer_name:   name,
          customer_email:  email,
          reseller_notes:  notes,
          status:          status,
          product_id:      '',
        };
      }).filter(r => r.username);
    },
	nextPage: function() {
      const paginate = document.querySelector('#datatable-users_paginate');
      if (!paginate) return false;
      const activeLi = paginate.querySelector('.paginate_button.active');
      if (!activeLi) return false;
      let sibling = activeLi.nextElementSibling;
      let hasNextPage = false;
      while (sibling) {
        if (sibling.id === 'datatable-users_next') break;
        if (sibling.id !== 'datatable-users_ellipsis' && !sibling.classList.contains('disabled')) {
          hasNextPage = true;
          break;
        }
        sibling = sibling.nextElementSibling;
      }
      if (!hasNextPage) return false;
      const nextPageLink = activeLi.nextElementSibling?.querySelector('a');
      if (nextPageLink) {
        nextPageLink.click();
        return true;
      }
      return false;
    },
    detect: function() {
      return !!document.querySelector('#datatable-users');
    },
    getTotal: function() {
      const info = document.querySelector('#datatable-users_info');
      if (!info) return null;
      const match = info.innerText.match(/of\s+([\d,]+)/i);
      return match ? parseInt(match[1].replace(',', '')) : null;
    }
  },

  // XUI.One reseller panel. Contributed by a Panelr customer; the lines
  // table carries no customer name, email or notes, so those stay empty
  // and are filled in on the review page or in Panelr.
  xui: {
    name: 'XUI.One',
    products: [
      { id: 'trial',       label: '24hr Free Trial',        duration_months: 0  },
      { id: 'monthly',     label: 'Monthly Connection',     duration_months: 1  },
      { id: 'quarterly',   label: 'Quarterly Connection',   duration_months: 3  },
      { id: 'semi_annual', label: 'Semi-Annual Connection', duration_months: 6  },
      { id: 'annual',      label: 'Annual Connection',      duration_months: 12 },
    ],
    extractPage: function() {
      // The Lines page: ID, Username, Password, Owner, Status, Online, Trial,
      // Active, Connections, Expiration, Last connection, Actions. The MAG
      // page has a MAC address column instead of a login. Columns are found by
      // their headings, so a panel that orders them differently still reads.
      const table = document.querySelector('#datatable-users');
      if (!table) return [];
      const heads = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.replace(/\s+/g, ' ').trim().toUpperCase());
      const col = (fallback, ...names) => {
        for (const n of names) { const i = heads.indexOf(n); if (i >= 0) return i; }
        for (const n of names) { const i = heads.findIndex(h => h.startsWith(n)); if (i >= 0) return i; }
        return fallback;
      };
      const macCol  = col(-1, 'MAC ADDRESS', 'MAC');
      const idCol   = col(0, 'ID');
      const userCol = col(macCol >= 0 ? -1 : 1, 'USERNAME');
      const passCol = col(macCol >= 0 ? -1 : 2, 'PASSWORD');
      const statCol = col(4, 'STATUS');
      const triCol  = col(6, 'TRIAL');
      const expCol  = col(9, 'EXPIRATION', 'EXPIRY', 'EXPIRE');
      const macLike = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
      const two = n => String(n || '00').padStart(2, '0');

      return Array.from(table.querySelectorAll('tbody tr')).map(tr => {
        const tds  = tr.querySelectorAll('td');
        if (tds.length < 5) return null;
        // A cell's text on one line: the panel shows a date above its time
        const text = i => (i >= 0 ? (tds[i]?.innerText || '') : '').replace(/\s+/g, ' ').trim();

        // Panelr wants YYYY-MM-DD HH:MM:SS. The panel shows day-month-year or
        // year-month-day, with or without a time.
        const raw = text(expCol);
        // A line that never runs out shows an infinity sign: no date
        let expiration = raw === '\u221e' ? '' : raw;
        let m = raw.match(/^(\d{2})-(\d{2})-(\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
        if (m) expiration = `${m[3]}-${m[2]}-${m[1]} ${two(m[4])}:${two(m[5])}:${two(m[6])}`;
        m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
        if (m) expiration = `${m[1]}-${m[2]}-${m[3]} ${two(m[4])}:${two(m[5])}:${two(m[6])}`;

        const statusHtml = statCol >= 0 ? (tds[statCol]?.innerHTML || '') : '';
        const status = statusHtml.includes('text-success') ? 'active'
                     : statusHtml.includes('text-warning') ? 'expired'
                     : 'disabled';
        const trial = text(triCol).toLowerCase() === 'yes';

        // A MAG device has no login of its own: it goes out by its MAC
        // address. Devices and lines are numbered apart on the panel, so a
        // device's number is taken only from its own edit link ("mag?id=7")
        // and written as "mag:7", the way Panelr knows a device. A row with
        // no such link goes out without a number, never with a guessed one.
        const username = text(userCol);
        const mac = macLike.test(text(macCol)) ? text(macCol) : (macLike.test(username) ? username : '');
        const magLink = mac ? tr.innerHTML.match(/\bmag\?id=(\d+)/) : null;
        return {
          panel_user_id:   mac ? (magLink ? 'mag:' + magLink[1] : '') : text(idCol),
          username:        mac ? '' : username,
          password:        mac ? '' : text(passCol),
          mac_address:     mac.toUpperCase().replace(/-/g, ':'),
          expiration_date: expiration,
          customer_name:   '',
          customer_email:  '',
          reseller_notes:  '',
          status:          status,
          product_id:      trial ? 'trial' : '',
        };
      }).filter(r => r && (r.username || r.mac_address));
    },
    nextPage: function() {
      const next = document.querySelector('#datatable-users_next:not(.disabled) a, #datatable-users_next:not(.disabled)');
      if (next) { next.click(); return true; }
      return false;
    },
    detect: function() {
      const table = document.querySelector('#datatable-users');
      if (!table) return false;
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.replace(/\s+/g, ' ').trim().toUpperCase());
      if (['ID', 'USERNAME', 'PASSWORD', 'OWNER', 'EXPIRATION', 'CONNECTIONS'].every(h => headers.includes(h))) return true;
      // The MAG page: a MAC address column where the Lines page has a password
      return ['ID', 'OWNER', 'EXPIRATION'].every(h => headers.includes(h)) && headers.some(h => h.startsWith('MAC'));
    },
    getTotal: function() {
      const text = document.querySelector('#datatable-users_info')?.innerText || '';
      const match = text.match(/of\s+([\d,]+)/i) || text.match(/from\s+([\d,]+)/i) || text.match(/([\d,]+)\s+entries/i);
      return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
    }
  },
};
