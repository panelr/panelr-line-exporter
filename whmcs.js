// WHMCS: the billing system talks for every panel behind it. Nothing is read
// from the pages; the WHMCS API answers with the customers, every service
// (the line's login, the panel's line id in Dedicated IP, the next due
// date, the product) and, where WHMCS still hands it out, each customer's
// login hash, so they keep their password on Panelr. The result is one
// migration file that Panelr's "Migrate from WHMCS" page reads.

async function whmcsExport(base, identifier, secret, onProgress) {
  base = base.replace(/\/+$/, '');
  const api = base + '/includes/api.php';

  const call = async function (action, params) {
    const body = new URLSearchParams(Object.assign({ identifier: identifier, secret: secret, action: action, responsetype: 'json' }, params || {}));
    let resp;
    try {
      resp = await fetch(api, { method: 'POST', body: body, credentials: 'omit' });
    } catch (e) {
      throw new Error('WHMCS could not be reached at ' + api + '. Check the address.');
    }
    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch (e) {
      throw new Error('WHMCS did not answer with data (HTTP ' + resp.status + '). The address should be the folder that holds /admin, and API access may be limited to certain IP addresses in WHMCS.');
    }
    if (json.result !== 'success') {
      throw new Error('WHMCS refused ' + action + ': ' + (json.message || 'no reason given'));
    }
    return json;
  };

  const page = async function (action, listKey, itemKey, label) {
    const out = [];
    let start = 0;
    while (true) {
      const j = await call(action, { limitstart: start, limitnum: 250 });
      const list = (j[listKey] && j[listKey][itemKey]) ? j[listKey][itemKey] : [];
      out.push.apply(out, list);
      const total = Number(j.totalresults || 0);
      onProgress(out.length + ' of ' + (total || '?') + ' ' + label + '…');
      start += list.length;
      if (!list.length || (total && start >= total)) break;
      if (start > 100000) break;
    }
    return out;
  };

  const clients  = await page('GetClients', 'clients', 'client', 'customers');
  const services = await page('GetClientsProducts', 'products', 'product', 'services');

  // The WHMCS products themselves, with their prices per billing cycle, so
  // Panelr can offer to price its plans the way WHMCS did
  const catalog = {};
  try {
    const j = await call('GetProducts', {});
    const list = (j.products && j.products.product) ? j.products.product : [];
    list.forEach(function (p) {
      const pricing = {};
      const byCurrency = p.pricing || {};
      const first = Object.keys(byCurrency)[0];
      const pr = first ? byCurrency[first] : {};
      ['monthly', 'quarterly', 'semiannually', 'annually', 'biennially', 'triennially'].forEach(function (cy) {
        if (pr && pr[cy] != null && Number(pr[cy]) >= 0) pricing[cy] = Number(pr[cy]);
      });
      catalog[String(p.pid)] = { name: p.name || '', group: p.groupname || '', paytype: p.paytype || '', currency: first ? (pr.prefix || pr.suffix || '').trim() : '', pricing: pricing };
    });
  } catch (e) { /* no catalog: prices come from the services instead */ }

  // The login hash, where WHMCS still gives it (deprecated since 8.0, so a
  // refusal is expected on newer installs and is not an error)
  let hashes = 0;
  for (let i = 0; i < clients.length; i++) {
    const c = clients[i];
    try {
      const j = await call('GetClientPassword', { userid: c.id });
      if (typeof j.password === 'string' && /^\$2[aby]\$\d\d\$/.test(j.password)) { c.password_hash = j.password; hashes++; }
    } catch (e) { /* no hash for this one */ }
    onProgress('Login details: ' + (i + 1) + ' of ' + clients.length + ' customers…');
  }

  const products = {};
  services.forEach(function (s) {
    const k = String(s.pid);
    if (!products[k]) products[k] = { pid: Number(s.pid), name: s.name || '', group: s.groupname || '', count: 0, cycles: {}, amounts: {} };
    products[k].count++;
    const cy = (s.billingcycle || '').toLowerCase().replace(/[^a-z]/g, '');
    products[k].cycles[cy] = (products[k].cycles[cy] || 0) + 1;
    const amt = Number(s.recurringamount);
    if (!isNaN(amt) && amt > 0) products[k].amounts[amt] = (products[k].amounts[amt] || 0) + 1;
  });
  // What the product costs: the WHMCS catalog price for the cycle its
  // services are on, else the amount most of its services pay
  Object.values(products).forEach(function (p) {
    const cycle = Object.keys(p.cycles).sort(function (a, b) { return p.cycles[b] - p.cycles[a]; })[0] || '';
    const cat = catalog[String(p.pid)];
    p.cycle = cycle;
    p.price = null;
    if (cat && cat.pricing && cat.pricing[cycle] != null) p.price = cat.pricing[cycle];
    if (p.price === null) {
      const common = Object.keys(p.amounts).sort(function (a, b) { return p.amounts[b] - p.amounts[a]; })[0];
      if (common != null) p.price = Number(common);
    }
    if (cat) { p.paytype = cat.paytype; p.currency = cat.currency; }
    delete p.amounts;
  });

  return {
    source: 'whmcs',
    format: 1,
    exported_at: new Date().toISOString(),
    whmcs_url: base,
    hashes: hashes,
    products: Object.values(products),
    clients: clients.map(function (c) {
      return {
        id: Number(c.id),
        name: [c.firstname, c.lastname].filter(Boolean).join(' ').trim() || (c.companyname || ''),
        company: c.companyname || '',
        email: (c.email || '').trim(),
        status: c.status || '',
        created: c.datecreated || '',
        password_hash: c.password_hash || null,
      };
    }),
    services: services.map(function (s) {
      const custom = {};
      const cf = s.customfields && s.customfields.customfield ? s.customfields.customfield : [];
      cf.forEach(function (f) { if (f && f.name) custom[f.name] = f.value == null ? '' : String(f.value); });
      return {
        id: Number(s.id),
        clientid: Number(s.clientid),
        pid: Number(s.pid),
        product: s.name || '',
        group: s.groupname || '',
        status: s.status || '',
        username: s.username || '',
        password: s.password || '',
        line_id: s.dedicatedip || '',
        domain: s.domain || '',
        next_due: s.nextduedate || '',
        reg_date: s.regdate || '',
        billing_cycle: s.billingcycle || '',
        amount: s.recurringamount || '',
        notes: s.notes || '',
        custom: custom,
      };
    }),
  };
}
