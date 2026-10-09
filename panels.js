const PANELS = {
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
      return Array.from(document.querySelectorAll('#datatable-users tbody tr')).map(tr => {
        const tds = tr.querySelectorAll('td');
        const notes = tds[5]?.innerText?.trim() || '';
        const emailMatch = notes.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        const email = emailMatch ? emailMatch[0] : '';
        const name = notes.replace(emailMatch ? emailMatch[0] : '', '').replace(/\(User ID:\s*\d+\)/i, '').trim().split('\n')[0].trim();
        const statusText = tds[7]?.querySelector('.badge')?.innerText?.trim() || '';
        const status = statusText === 'Yes' ? 'active' : (statusText === 'Expired' ? 'expired' : 'disabled');
        const linkDropdown = tds[2]?.innerHTML || '';
        const apiMatch = linkDropdown.match(/api\('(\d+)'/);
        const panelUserId = apiMatch ? apiMatch[1] : '';
        return {
          panel_user_id:   panelUserId,
          username:        tds[0]?.innerText?.trim() || '',
          password:        tds[1]?.innerText?.trim() || '',
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
        const name = notes.replace(emailMatch ? emailMatch[0] : '', '').trim().split('\n')[0].trim();
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
      // Columns: 0 ID, 1 Username, 2 Password, 3 Owner, 4 Status, 5 Online,
      // 6 Trial, 7 Active, 8 Connections, 9 Expiration, 10 Last connection, 11 Actions
      return Array.from(document.querySelectorAll('#datatable-users tbody tr')).map(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length < 10) return null;
        // XUI shows DD-MM-YYYY HH:MM:SS; Panelr wants YYYY-MM-DD HH:MM:SS
        const raw = tds[9]?.innerText?.trim() || '';
        let expiration = raw;
        const m = raw.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
        if (m) expiration = `${m[3]}-${m[2]}-${m[1]} ${m[4] || '00'}:${m[5] || '00'}:${m[6] || '00'}`;
        const statusHtml = tds[4]?.innerHTML || '';
        const status = statusHtml.includes('text-success') ? 'active'
                     : statusHtml.includes('text-warning') ? 'expired'
                     : 'disabled';
        const trial = (tds[6]?.innerText?.trim() || '').toLowerCase() === 'yes';
        return {
          panel_user_id:   tds[0]?.innerText?.trim() || '',
          username:        tds[1]?.innerText?.trim() || '',
          password:        tds[2]?.innerText?.trim() || '',
          expiration_date: expiration,
          customer_name:   '',
          customer_email:  '',
          reseller_notes:  '',
          status:          status,
          product_id:      trial ? 'trial' : '',
        };
      }).filter(r => r && r.username);
    },
    nextPage: function() {
      const next = document.querySelector('#datatable-users_next:not(.disabled) a, #datatable-users_next:not(.disabled)');
      if (next) { next.click(); return true; }
      return false;
    },
    detect: function() {
      const table = document.querySelector('#datatable-users');
      if (!table) return false;
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim().toUpperCase());
      return ['ID', 'USERNAME', 'PASSWORD', 'OWNER', 'EXPIRATION', 'CONNECTIONS'].every(h => headers.includes(h));
    },
    getTotal: function() {
      const text = document.querySelector('#datatable-users_info')?.innerText || '';
      const match = text.match(/of\s+([\d,]+)/i) || text.match(/from\s+([\d,]+)/i) || text.match(/([\d,]+)\s+entries/i);
      return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
    }
  },
};
