
const $ = (id) => document.getElementById(id);

const moneyM = n =>
  (n < 0 ? '-$' : '$') +
  Math.abs(n / 1e6).toFixed(1) +
  'M';

const money = (n, digits = 0) =>
  '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

const compact = n => n.toLocaleString('en-US');

const state = {
  period: 30,
  price: 2340,
  production: 85000,
  cost: 1420,
  capital: 28,
  priceShock: -10,
  costShock: 10
};

let livePrices = null;

function seededSeries(start, count, volatility, drift, seed) {
  let x = seed;
  let value = start;
  const arr = [];

  for (let i = 0; i < count; i++) {
    x = (x * 9301 + 49297) % 233280;
    const noise = (x / 233280 - 0.5) * volatility;
    value *= (1 + drift + noise);
    arr.push(value);
  }

  const scale = start / arr[0];
  return arr.map(v => v * scale);
}

function linePath(values, width, height, pad = 2) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values.map((v, i) =>
    `${i ? 'L' : 'M'}${pad + i * (width - pad * 2) /
      (values.length - 1)},${height - pad -
      (v - min) / span * (height - pad * 2)}`
  ).join(' ');
}

function drawSpark(id, values, color) {
  const svg = $(id);
  if (!svg) return;

  const w = 320;
  const h = 66;
  const p = 3;
  const path = linePath(values, w, h, p);
  const last = values.length - 1;
  const x = p + last * (w - p * 2) / (values.length - 1);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const y = h - p -
    (values[last] - min) / (max - min || 1) * (h - p * 2);

  svg.innerHTML =
    `<path d="${path} L ${w - p} ${h} L ${p} ${h} Z"
      fill="${color}" opacity=".09"></path>` +
    `<path d="${path}" fill="none" stroke="${color}"
      stroke-width="2.2" stroke-linecap="round"
      stroke-linejoin="round"></path>` +
    `<circle cx="${x}" cy="${y}" r="3" fill="${color}"
      stroke="#111b2d" stroke-width="2"></circle>`;
}

function drawMarketChart() {
  const gold = seededSeries(100, state.period, 0.032, 0.001, 7);
  const copper = seededSeries(100, state.period, 0.025, 0.0004, 12);

  const svg = $('marketChart');
  if (!svg) return;

  const w = 720;
  const h = 230;
  const pad = 12;
  const yMap = v => h - pad - (v - 90) / 25 * (h - pad * 2);
  const xMap = i => pad + i * (w - pad * 2) / (state.period - 1);

  let grid = '';

  [90, 95, 100, 105, 110, 115].forEach(v => {
    const y = yMap(v);
    grid += `<line x1="${pad}" y1="${y}" x2="${w - pad}"
      y2="${y}" stroke="#2b3a50" stroke-width="1"
      stroke-dasharray="3 5"/>`;
    grid += `<text x="0" y="${y + 3}" fill="#718198"
      font-size="9" font-family="DM Mono">${v}</text>`;
  });

  const path = arr => arr.map((v, i) =>
    `${i ? 'L' : 'M'}${xMap(i)},${yMap(v)}`
  ).join(' ');

  svg.innerHTML =
    grid +
    `<path d="${path(gold)}" fill="none" stroke="#e9b65d"
      stroke-width="2.5" stroke-linecap="round"
      stroke-linejoin="round"/>` +
    `<path d="${path(copper)}" fill="none" stroke="#83a8ff"
      stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" opacity=".9"/>`;
}

function renderMarkets() {
  // These series are illustrative only, not historical market data.
  const g = seededSeries(2340, state.period, 0.012, 0.0012, 21);
  const c = seededSeries(9180, state.period, 0.009, 0.0003, 14);
  const f = seededSeries(108.5, state.period, 0.011, -0.0001, 42);

  $('goldPrice').textContent = money(g[g.length - 1], 2);
  $('copperPrice').textContent = money(c[c.length - 1], 2);
  $('ironPrice').textContent = money(f[f.length - 1], 2);

  ['goldRange', 'copperRange', 'ironRange'].forEach(id => {
    if ($(id)) $(id).textContent = `${state.period}-day illustrative view`;
  });

  drawSpark('goldSpark', g, '#e9b65d');
  drawSpark('copperSpark', c, '#e8a078');
  drawSpark('ironSpark', f, '#80b9d1');
  drawMarketChart();

  // Restore the latest API prices after re-rendering the cards.
  if (livePrices) applyLivePrices();
}

function displayUnit(unit) {
  if (!unit) return 'unit unavailable';

  const u = String(unit)
    .replace(/^USD[_\s-]*per[_\s-]*/i, '')
    .replace(/^USD[_\s-]*/i, '')
    .replaceAll('_', ' ')
    .trim()
    .toLowerCase();

  if (/troy\s*ounce|troy oz|^toz$/.test(u)) return 'troy oz';
  if (/^ounce$|^oz$/.test(u)) return 'oz';
  if (/^pound$|^lb$/.test(u)) return 'lb';
  if (/metric tonne|metric ton|^tonne$|^ton$/.test(u)) return 'metric tonne';
  if (/^kilogram$|^kg$/.test(u)) return 'kg';
  if (/^gram$|^g$/.test(u)) return 'g';

  return u;
}

function applyLivePrices() {
  if (!livePrices) return;

  const items = [
    { key: 'gold', priceId: 'goldPrice', rangeId: 'goldRange' },
    { key: 'copper', priceId: 'copperPrice', rangeId: 'copperRange' },
    { key: 'iron_ore', priceId: 'ironPrice', rangeId: 'ironRange' }
  ];

  for (const item of items) {
    const record = livePrices[item.key];
    if (!record) continue;

    const price = Number(record.price);
    if (!Number.isFinite(price)) continue;

    const priceElement = $(item.priceId);
    if (priceElement) {
      priceElement.textContent = money(price, 2);
      priceElement.title =
        `Source: ${record.source || 'OilPriceAPI'} | ` +
        `Code: ${record.code || item.key}`;
    }

    const card = priceElement?.closest('.commodity-card');
    if (!card) continue;

    const unitElement = card.querySelector('.commodity-name span');
    if (unitElement) {
      unitElement.textContent = `USD / ${displayUnit(record.unit)}`;
    }

    const footer = card.querySelector('.card-foot');
    if (footer) {
      const statusElement = footer.querySelector('span:first-child');
      const dateElement = footer.querySelector('span:last-child');

      const isStale = record.stale === true;
      const isSynthetic = record.synthetic === true;
      const isCurrent = record.data_status === 'current';

      if (statusElement) {
        if (isSynthetic) {
          statusElement.textContent = 'SYNTHETIC API DATA';
        } else if (isStale) {
          statusElement.textContent = 'STALE DATA';
        } else if (isCurrent) {
          statusElement.textContent = 'API DATA · CURRENT';
        } else {
          statusElement.textContent = 'API DATA · STATUS UNVERIFIED';
        }
      }

      if (dateElement) {
        const sourceDate = record.source_as_of;

        dateElement.textContent = sourceDate
          ? `As of ${new Date(sourceDate).toLocaleString()}`
          : 'Source time unavailable';
      }
    }
  }

  // The hero shows a gold value per metric tonne when the API
  // price is quoted per troy ounce. Otherwise, show the quote
  // in its original unit rather than inventing a conversion.
  const gold = livePrices.gold;

  if (gold && Number.isFinite(Number(gold.price))) {
    const unit = String(gold.unit || '').toLowerCase();
    let heroPrice = null;

    if (/troy\s*ounce|troy_ounce|troy oz|toz/.test(unit)) {
      heroPrice = Number(gold.price) * 32150.7466;
    } else if (/metric[_\s-]*tonne|metric[_\s-]*ton|^tonne$|^ton$/i.test(unit)) {
      heroPrice = Number(gold.price);
    }

    if ($('heroValue')) {
      $('heroValue').textContent = heroPrice !== null
        ? money(heroPrice, 0)
        : money(Number(gold.price), 2);
    }
  }
}

async function loadLivePrices() {
  try {
    const response = await fetch(
      `data/latest-prices.json?t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`Price file request failed: HTTP ${response.status}`);
    }

    const json = await response.json();
    const prices = json.prices;

    if (!prices?.gold || !prices?.copper || !prices?.iron_ore) {
      throw new Error('Gold, copper, or iron ore data is missing.');
    }

    for (const key of ['gold', 'copper', 'iron_ore']) {
      const record = prices[key];

      if (!Number.isFinite(Number(record.price))) {
        throw new Error(`Invalid price for ${key}.`);
      }
    }

    livePrices = prices;
    applyLivePrices();

    console.info('Orelytics price data loaded:', {
      provider: json.provider,
      updated_at: json.updated_at,
      prices
    });
  } catch (error) {
    console.error('Could not load Orelytics prices:', error);

    document.querySelectorAll('.commodity-card .card-foot span:first-child')
      .forEach(el => {
        el.textContent = 'LIVE DATA UNAVAILABLE';
      });
  }
}

function getModel(price = state.price, cost = state.cost) {
  const revenue = price * state.production;
  const operating = cost * state.production;
  const other = state.capital * 1e6;
  const surplus = revenue - operating - other;
  const margin = revenue ? surplus / revenue * 100 : 0;
  const breakeven = state.cost + other / state.production;

  return { revenue, operating, other, surplus, margin, breakeven };
}

function updateModel() {
  $('priceOut').textContent = money(state.price) + ' / oz';
  $('productionOut').textContent = compact(state.production) + ' oz';
  $('costOut').textContent = money(state.cost) + ' / oz';
  $('capitalOut').textContent = '$' + state.capital.toFixed(1) + 'M';

  const m = getModel();

  $('surplus').textContent = moneyM(m.surplus);
  $('surplus').classList.toggle('negative', m.surplus < 0);
  $('revenue').textContent = moneyM(m.revenue);
  $('operatingCost').textContent = moneyM(m.operating);
  $('margin').textContent = m.margin.toFixed(1) + '%';
  $('breakeven').textContent = money(m.breakeven) + ' / oz';

  const status = $('scenarioStatus');
  status.textContent = m.surplus >= 0
    ? 'Positive margin'
    : 'Negative margin';
  status.classList.toggle('negative', m.surplus < 0);

  const safeRevenue = Math.max(m.revenue, 1);
  const opPct = Math.max(0, m.operating / safeRevenue * 100);
  const otherPct = Math.max(0, m.other / safeRevenue * 100);
  const surPct = Math.max(0, m.surplus / safeRevenue * 100);

  $('costBar').style.width = Math.min(100, opPct) + '%';
  $('otherBar').style.width = Math.min(100, otherPct) + '%';
  $('surplusBar').style.width = Math.min(100, surPct) + '%';

  $('costPct').textContent = opPct.toFixed(1) + '%';
  $('otherPct').textContent = otherPct.toFixed(1) + '%';
  $('surplusPct').textContent = surPct.toFixed(1) + '%';

  updateStress();
}

function updateStress() {
  $('priceShockOut').textContent =
    (state.priceShock > 0 ? '+' : '') + state.priceShock + '%';

  $('costShockOut').textContent =
    (state.costShock > 0 ? '+' : '') + state.costShock + '%';

  const stressed = getModel(
    state.price * (1 + state.priceShock / 100),
    state.cost * (1 + state.costShock / 100)
  );

  const base = getModel();

  $('stressSurplus').textContent = moneyM(stressed.surplus);
  $('stressSurplus').style.color =
    stressed.surplus < 0 ? 'var(--red)' : 'var(--green)';

  const delta = stressed.surplus - base.surplus;

  $('stressDelta').textContent =
    (delta >= 0 ? '+' : '−') +
    moneyM(Math.abs(delta)) +
    ' vs baseline';

  let title;
  let body;
  let icon;

  if (stressed.surplus < 0) {
    title = 'The scenario moves into a deficit';
    body = 'Under these assumptions, modeled revenue does not cover operating costs and annualized other costs. Test lower costs, higher output, or a less severe price decline.';
    icon = '!';
  } else if (delta < 0) {
    title = 'The scenario remains positive, with less headroom';
    body = 'The combined shock reduces the estimated annual surplus. This highlights why projects test several price and cost cases rather than relying on one forecast.';
    icon = '↘';
  } else {
    title = 'The scenario improves under these assumptions';
    body = 'The modeled surplus is higher than the baseline. The result depends on your selected inputs and is not a prediction of actual mine performance.';
    icon = '↗';
  }

  $('riskTakeaway').innerHTML =
    `<span class="takeaway-icon">${icon}</span>` +
    `<div><strong>${title}</strong><p>${body}</p></div>`;
}

['price', 'production', 'cost', 'capital', 'priceShock', 'costShock']
  .forEach(id => {
    $(id).addEventListener('input', e => {
      state[id] = Number(e.target.value);
      updateModel();
    });
  });

document.querySelectorAll('.period').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.period')
      .forEach(b => b.classList.remove('active'));

    btn.classList.add('active');
    state.period = Number(btn.dataset.period);
    renderMarkets();
  });
});

$('resetBtn').addEventListener('click', () => {
  Object.assign(state, {
    price: 2340,
    production: 85000,
    cost: 1420,
    capital: 28,
    priceShock: -10,
    costShock: 10
  });

  Object.keys(state).filter(k => $(k)).forEach(k => {
    $(k).value = state[k];
  });

  updateModel();
});

$('exportBtn').addEventListener('click', () => {
  const m = getModel();

  const rows = [
    ['Orelytics scenario export', 'Value'],
    ['Generated at', new Date().toISOString()],
    ['Data type', 'Illustrative educational model; not live data'],
    ['Selling price USD/oz', state.price],
    ['Annual production oz', state.production],
    ['Operating cost USD/oz', state.cost],
    ['Annualized capital and other costs USD', state.capital * 1e6],
    ['Annual revenue USD', m.revenue],
    ['Annual operating cost USD', m.operating],
    ['Annualized other costs USD', m.other],
    ['Estimated annual operating surplus USD', m.surplus],
    ['Surplus margin percent', m.margin],
    ['Break-even price USD/oz', m.breakeven],
    ['Stress price change percent', state.priceShock],
    ['Stress operating cost change percent', state.costShock],
    [
      'Stressed annual surplus USD',
      getModel(
        state.price * (1 + state.priceShock / 100),
        state.cost * (1 + state.costShock / 100)
      ).surplus
    ]
  ];

  const csv = rows.map(row =>
    row.map(value =>
      '"' + String(value).replaceAll('"', '""') + '"'
    ).join(',')
  ).join('\r\n');

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'orelytics-scenario.csv';
  a.click();

  URL.revokeObjectURL(url);
});

// Start the dashboard.
renderMarkets();
updateModel();
loadLivePrices();
