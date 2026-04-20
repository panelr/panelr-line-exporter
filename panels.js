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
  }
};