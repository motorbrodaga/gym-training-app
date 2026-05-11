'use strict';

const app = document.querySelector('#app');
const STATIC_MODE = location.hostname.endsWith('github.io') || location.protocol === 'file:';
const STORAGE_KEY = 'autoServiceStaticDataV1';
const SEED_VEHICLES = [
  {
    id: 'vehicle-toyota-land-cruiser-200-jtmcv02j004239626',
    name: 'Toyota Land Cruiser 200 М050АА36',
    brand: 'Toyota',
    model: 'Land Cruiser 200',
    plate: 'М050АА36',
    year: '2017',
    vin: 'JTMCV02J004239626',
    currentKm: '',
    notes: [
      'Данные внесены по СТС: Тойота/СТС.jpg',
      'Категория: B/M1G',
      'Цвет: белый',
      'ПТС: 78УХ 384015',
      'СТС: 99 72 655802',
      'Технически допустимая масса: 3350 кг',
      'Масса в снаряженном состоянии: 2740 кг',
    ].join('\n'),
  },
  {
    id: 'vehicle-bmw-x7-wbacw8105l9d41600',
    name: 'BMW X7 xDrive30d М050АА136',
    brand: 'BMW',
    model: 'X7 xDrive30d',
    plate: 'М050АА136',
    year: '2020',
    vin: 'WBACW8105L9D41600',
    currentKm: '',
    notes: [
      'Данные внесены по СТС: BMW/СТС.jpg',
      'Категория: B/M1',
      'Цвет: белый',
      'ПТС: 1643 0212836934',
      'СТС: 99 81 811939',
      'Технически допустимая масса: 3220 кг',
      'Масса в снаряженном состоянии: 2845 кг',
    ].join('\n'),
  },
  {
    id: 'vehicle-kia-mohave-xwekn814d00053514',
    name: 'Kia Mohave Е050АК136',
    brand: 'Kia',
    model: 'Mohave / Borrego',
    plate: 'Е050АК136',
    year: '2016',
    vin: 'XWEKN814D00053514',
    currentKm: '',
    notes: [
      'Данные внесены по СТС: киа мохав/SAVE_20190711_154352.jpeg',
      'Марка/модель по СТС: KIA HM BORREGO MOHAVE',
      'Категория: B',
      'Цвет: белый',
      'СТС: 99 03 598450',
      'Разрешенная максимальная масса: 2820 кг',
      'Масса без нагрузки: 2356 кг',
    ].join('\n'),
  },
];

const state = {
  user: null,
  setupRequired: false,
  vehicles: [],
  records: [],
  tab: 'dashboard',
  query: '',
  typeFilter: 'Все',
  vehicleFilter: 'Все',
  installEvent: null,
};

const TYPES = ['ТО', 'Ремонт', 'Диагностика', 'Шины', 'Страховка', 'Прочее'];
const STATUSES = ['Выполнено', 'План', 'В работе', 'Отложено'];

const icons = {
  garage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M8 20v-6h8v6"/></svg>`,
  car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2l-2-6H5l-2 6h2"/><path d="M7 17h10"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="m6 11 1.5-4h9L18 11"/></svg>`,
  wrench: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-3-3 2.8-2.8Z"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>`,
};

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  const number = Number(String(value || 0).replace(',', '.')) || 0;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(number);
}

function dateRu(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ru-RU').format(date);
}

function daysUntil(value) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  return Math.ceil((target - now) / 86400000);
}

function vehicleById(id) {
  return state.vehicles.find(vehicle => vehicle.id === id);
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStaticData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!localStorage.getItem(STORAGE_KEY)) {
      data.vehicles = SEED_VEHICLES.map(vehicle => ({
        ...vehicle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      data.records = [];
      writeStaticData(data);
    }
    return data;
  } catch {
    return {};
  }
}

function writeStaticData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    user: data.user || null,
    vehicles: data.vehicles || [],
    records: data.records || [],
    updatedAt: new Date().toISOString(),
  }));
}

function staticVehicleFromBody(body, id = '') {
  const name = String(body.name || '').trim()
    || [body.brand, body.model].map(value => String(value || '').trim()).filter(Boolean).join(' ')
    || 'Без названия';
  return {
    id: id || body.id || createId(),
    name,
    brand: String(body.brand || '').trim(),
    model: String(body.model || '').trim(),
    plate: String(body.plate || '').trim(),
    year: String(body.year || '').trim(),
    vin: String(body.vin || '').trim(),
    currentKm: String(body.currentKm || body.current_km || '').trim(),
    notes: String(body.notes || '').trim(),
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function staticRecordFromBody(body, id = '') {
  return {
    id: id || body.id || createId(),
    vehicleId: String(body.vehicleId || body.vehicle_id || '').trim(),
    date: String(body.date || today()).trim(),
    type: String(body.type || 'ТО').trim(),
    odometer: String(body.odometer || '').trim(),
    title: String(body.title || 'Без названия').trim(),
    parts: String(body.parts || '').trim(),
    contractor: String(body.contractor || '').trim(),
    cost: String(body.cost || '').trim(),
    nextDate: String(body.nextDate || body.next_date || '').trim(),
    nextKm: String(body.nextKm || body.next_km || '').trim(),
    notes: String(body.notes || '').trim(),
    status: String(body.status || 'Выполнено').trim(),
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function updateStaticVehicleKm(data, vehicleId, odometer) {
  const numericOdometer = Number(odometer || 0);
  if (!numericOdometer) return;
  const vehicle = data.vehicles.find(item => item.id === vehicleId);
  if (!vehicle) return;
  const current = Number(vehicle.currentKm || 0);
  if (numericOdometer > current) {
    vehicle.currentKm = String(numericOdometer);
    vehicle.updatedAt = new Date().toISOString();
  }
}

async function staticApi(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const data = readStaticData();
  data.vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
  data.records = Array.isArray(data.records) ? data.records : [];

  if (url === '/api/me') return { setupRequired: !data.user, user: data.user || null };

  if (url === '/api/setup' && method === 'POST') {
    if (data.user) throw new Error('Первый пользователь уже создан');
    if (String(body.password || '').length < 6) throw new Error('Пароль должен быть минимум 6 символов');
    data.user = { id: createId(), name: String(body.name || 'Администратор').trim(), role: 'admin' };
    writeStaticData(data);
    return { user: data.user };
  }

  if (url === '/api/login' && method === 'POST') {
    if (!data.user) throw new Error('Сначала создай вход');
    data.user.name = String(body.name || data.user.name || 'Администратор').trim();
    writeStaticData(data);
    return { user: data.user };
  }

  if (url === '/api/logout' && method === 'POST') return { ok: true };
  if (url === '/api/vehicles' && method === 'GET') return [...data.vehicles].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  if (url === '/api/records' && method === 'GET') return [...data.records].sort((a, b) => `${b.date}${b.updatedAt}`.localeCompare(`${a.date}${a.updatedAt}`));

  if (url === '/api/vehicles' && method === 'POST') {
    const vehicle = staticVehicleFromBody(body);
    data.vehicles.push(vehicle);
    writeStaticData(data);
    return vehicle;
  }

  const vehicleMatch = url.match(/^\/api\/vehicles\/(.+)$/);
  if (vehicleMatch && method === 'PUT') {
    const index = data.vehicles.findIndex(item => item.id === vehicleMatch[1]);
    if (index === -1) throw new Error('Машина не найдена');
    data.vehicles[index] = { ...staticVehicleFromBody(body, vehicleMatch[1]), createdAt: data.vehicles[index].createdAt };
    writeStaticData(data);
    return data.vehicles[index];
  }

  if (vehicleMatch && method === 'DELETE') {
    data.vehicles = data.vehicles.filter(item => item.id !== vehicleMatch[1]);
    data.records = data.records.filter(item => item.vehicleId !== vehicleMatch[1]);
    writeStaticData(data);
    return { ok: true };
  }

  if (url === '/api/records' && method === 'POST') {
    const record = staticRecordFromBody(body);
    if (!data.vehicles.some(item => item.id === record.vehicleId)) throw new Error('Выберите машину');
    data.records.push(record);
    updateStaticVehicleKm(data, record.vehicleId, record.odometer);
    writeStaticData(data);
    return record;
  }

  const recordMatch = url.match(/^\/api\/records\/(.+)$/);
  if (recordMatch && method === 'PUT') {
    const index = data.records.findIndex(item => item.id === recordMatch[1]);
    if (index === -1) throw new Error('Запись не найдена');
    const record = { ...staticRecordFromBody(body, recordMatch[1]), createdAt: data.records[index].createdAt };
    if (!data.vehicles.some(item => item.id === record.vehicleId)) throw new Error('Выберите машину');
    data.records[index] = record;
    updateStaticVehicleKm(data, record.vehicleId, record.odometer);
    writeStaticData(data);
    return record;
  }

  if (recordMatch && method === 'DELETE') {
    data.records = data.records.filter(item => item.id !== recordMatch[1]);
    writeStaticData(data);
    return { ok: true };
  }

  if (url === '/api/import' && method === 'POST') {
    const vehicles = Array.isArray(body.vehicles) ? body.vehicles.map(item => staticVehicleFromBody(item, item.id)) : [];
    const records = Array.isArray(body.records) ? body.records.map(item => staticRecordFromBody(item, item.id)) : [];
    data.vehicles = vehicles;
    data.records = records.filter(record => vehicles.some(vehicle => vehicle.id === record.vehicleId));
    writeStaticData(data);
    return { ok: true, importedVehicles: data.vehicles.length, importedRecords: data.records.length };
  }

  throw new Error('Действие не поддерживается');
}

function toast(message, type = 'ok') {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : ''}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

async function api(url, options = {}) {
  if (STATIC_MODE) return staticApi(url, options);

  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const type = response.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    if (response.status === 401) {
      state.user = null;
      render();
    }
    throw new Error(data?.error || 'Ошибка сервера');
  }
  return data;
}

async function boot() {
  try {
    const me = await api('/api/me');
    state.setupRequired = me.setupRequired;
    state.user = me.user;
    if (state.user) await loadData();
    render();
  } catch (error) {
    app.innerHTML = `<div class="auth-page"><div class="auth-card"><div class="logo">${icons.wrench}</div><h1>Сервер не отвечает</h1><p>${esc(error.message)}</p></div></div>`;
  }
}

async function loadData() {
  const [vehicles, records] = await Promise.all([api('/api/vehicles'), api('/api/records')]);
  state.vehicles = vehicles;
  state.records = records;
}

function render() {
  if (!state.user) return renderAuth();
  app.innerHTML = `
    <main class="app-shell">
      ${renderHero()}
      ${renderToolbar()}
      ${state.tab === 'dashboard' ? renderDashboard() : ''}
      ${state.tab === 'vehicles' ? renderVehicles() : ''}
      ${state.tab === 'records' ? renderRecords() : ''}
    </main>
    ${renderNav()}
    <input id="importFile" type="file" accept="application/json" class="hidden" />
  `;
  bindMainEvents();
}

function renderAuth() {
  const isSetup = state.setupRequired;
  app.innerHTML = `
    <section class="auth-page">
      <div class="auth-card">
        <div class="logo">${icons.garage}</div>
        <h1>${isSetup ? 'Создай вход' : 'Вход в гараж'}</h1>
        <p>${isSetup
          ? 'Первый запуск. Создай администратора, потом эту ссылку можно открыть с телефона, компьютера или планшета.'
          : 'Введи имя и пароль. Все машины и ремонты будут синхронизироваться через сервер.'}</p>
        <form id="authForm" class="form-grid">
          <label class="field">Имя
            <input name="name" autocomplete="username" placeholder="Например: Мотор" required />
          </label>
          <label class="field">Пароль
            <input name="password" type="password" autocomplete="current-password" minlength="6" required />
          </label>
          <button class="btn full" type="submit">${isSetup ? 'Создать и войти' : 'Войти'}</button>
        </form>
        <div class="install-hint small">
          На телефоне открой ссылку в Safari или Chrome и добавь приложение на главный экран. Получится почти как обычная иконка приложения.
        </div>
      </div>
    </section>
  `;

  document.querySelector('#authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api(isSetup ? '/api/setup' : '/api/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      state.user = result.user;
      state.setupRequired = false;
      await loadData();
      render();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

function renderHero() {
  return `
    <section class="hero">
      <div class="hero-top">
        <div class="logo">${icons.garage}</div>
        <div class="user-chip"><span>${esc(state.user.name)}</span> 🔐</div>
      </div>
      <h1>Авто ТО и ремонты</h1>
      <p>Несколько машин, история работ, заменённые запчасти, пробег или моточасы на момент ремонта, расходы и будущие работы. Гаражная бухгалтерия без бумажного тумана.</p>
    </section>
  `;
}

function renderToolbar() {
  return `
    <section class="toolbar">
      <div class="muted small">База на сервере · машин: <b>${state.vehicles.length}</b> · записей: <b>${state.records.length}</b></div>
      <div class="toolbar-actions">
        <button class="btn secondary" data-action="add-vehicle">${icons.plus} Машина</button>
        <button class="btn secondary" data-action="add-record" ${state.vehicles.length ? '' : 'disabled'}>${icons.plus} Работа</button>
        <button class="btn ghost" data-action="export">${icons.download} Экспорт</button>
        <button class="btn ghost" data-action="import">${icons.upload} Импорт</button>
        <button class="btn ghost" data-action="logout">${icons.logout} Выход</button>
      </div>
    </section>
  `;
}

function renderNav() {
  const tabs = [
    ['dashboard', icons.list, 'Панель'],
    ['vehicles', icons.car, 'Машины'],
    ['records', icons.wrench, 'Работы'],
  ];
  return `<nav class="nav">${tabs.map(([id, icon, label]) => `
    <button class="${state.tab === id ? 'active' : ''}" data-tab="${id}">${icon}<span>${label}</span></button>
  `).join('')}</nav>`;
}

function renderDashboard() {
  const totalCost = state.records.reduce((sum, item) => sum + (Number(String(item.cost || 0).replace(',', '.')) || 0), 0);
  const repairs = state.records.filter(item => item.type === 'Ремонт').length;
  const plans = state.records.filter(item => item.status !== 'Выполнено').length;
  const upcoming = getUpcomingRecords();

  return `
    <section class="grid stats">
      ${renderStat('Машин', state.vehicles.length, 'Можно вести автопарк целиком', icons.car)}
      ${renderStat('Записей', state.records.length, 'ТО, ремонты, шины, диагностика', icons.list)}
      ${renderStat('Расходы', money(totalCost), `${repairs} ремонтных записей`, icons.wrench)}
      ${renderStat('На контроле', upcoming.length + plans, 'Ближайшие и плановые работы', icons.garage)}
    </section>

    <section class="grid two" style="margin-top:14px">
      <div class="card">
        <div class="card-title">
          <div><h2>Ближайшие работы</h2><div class="muted small">Что пора не упустить</div></div>
          <button class="btn secondary" data-action="add-record" ${state.vehicles.length ? '' : 'disabled'}>${icons.plus} Добавить</button>
        </div>
        <div class="grid">
          ${upcoming.length ? upcoming.map(renderRecordItem).join('') : `<div class="empty">Плановых работ пока нет. Тихо, ровно, даже ключи отдыхают.</div>`}
        </div>
      </div>
      <div class="card">
        <div class="card-title">
          <div><h2>Машины</h2><div class="muted small">Краткая сводка расходов</div></div>
        </div>
        <div class="grid">
          ${state.vehicles.length ? state.vehicles.map(renderVehicleMini).join('') : `<div class="empty">Добавь первую машину.</div>`}
        </div>
      </div>
    </section>
  `;
}

function renderStat(label, value, hint, icon) {
  return `<article class="card stat compact"><div class="icon">${icon}</div><div><div class="muted small">${esc(label)}</div><div class="big">${esc(value)}</div><div class="muted small">${esc(hint)}</div></div></article>`;
}

function renderVehicles() {
  return `
    <section class="card">
      <div class="card-title">
        <div><h2>Машины и техника</h2><div class="muted small">Карточки автомобилей, спецтехники и агрегатов</div></div>
        <button class="btn" data-action="add-vehicle">${icons.plus} Добавить</button>
      </div>
    </section>
    <section class="grid cards" style="margin-top:14px">
      ${state.vehicles.length ? state.vehicles.map(renderVehicleCard).join('') : `<div class="card empty">Пока нет машин. Самое время завести первую железную лошадь.</div>`}
    </section>
  `;
}

function renderVehicleMini(vehicle) {
  const records = state.records.filter(item => item.vehicleId === vehicle.id);
  const cost = records.reduce((sum, item) => sum + (Number(String(item.cost || 0).replace(',', '.')) || 0), 0);
  return `<article class="item">
    <div class="item-head">
      <div><h3>${esc(vehicle.name)}</h3><div class="muted small">${esc(vehicle.plate || 'Без номера')} · ${esc(vehicle.currentKm || 0)} км/мч</div></div>
      <b>${money(cost)}</b>
    </div>
  </article>`;
}

function renderVehicleCard(vehicle) {
  const records = state.records.filter(item => item.vehicleId === vehicle.id);
  const cost = records.reduce((sum, item) => sum + (Number(String(item.cost || 0).replace(',', '.')) || 0), 0);
  return `<article class="card">
    <div class="card-title">
      <div class="logo" style="background:#f1f5f9;color:#0f172a">${icons.car}</div>
      <div class="inline-actions">
        <button class="icon-btn" data-action="edit-vehicle" data-id="${esc(vehicle.id)}">${icons.edit}</button>
        <button class="icon-btn danger" data-action="delete-vehicle" data-id="${esc(vehicle.id)}">${icons.trash}</button>
      </div>
    </div>
    <h2>${esc(vehicle.name)}</h2>
    <div class="muted small">${esc([vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' · ') || 'Данные не указаны')}</div>
    <div class="kv" style="margin-top:12px">
      <div><span>Номер</span><strong>${esc(vehicle.plate || '—')}</strong></div>
      <div><span>Пробег/мч</span><strong>${esc(vehicle.currentKm || 0)}</strong></div>
      <div><span>Записей</span><strong>${records.length}</strong></div>
      <div><span>Расходы</span><strong>${money(cost)}</strong></div>
    </div>
    ${vehicle.notes ? `<p class="muted small">${esc(vehicle.notes)}</p>` : ''}
    <button class="btn full secondary" style="margin-top:12px" data-action="add-record-for" data-id="${esc(vehicle.id)}">${icons.plus} Записать ТО/ремонт</button>
  </article>`;
}

function renderRecords() {
  const records = getFilteredRecords();
  return `
    <section class="card">
      <div class="card-title">
        <div><h2>ТО и ремонты</h2><div class="muted small">Дата, работы, запчасти, пробег и расходы</div></div>
        <button class="btn" data-action="add-record" ${state.vehicles.length ? '' : 'disabled'}>${icons.plus} Добавить</button>
      </div>
      <div class="filters">
        <input id="searchInput" placeholder="Поиск по работам, запчастям, сервису..." value="${esc(state.query)}" />
        <select id="typeFilter">
          ${['Все', ...TYPES].map(type => `<option ${state.typeFilter === type ? 'selected' : ''}>${esc(type)}</option>`).join('')}
        </select>
        <select id="vehicleFilter">
          <option value="Все">Все машины</option>
          ${state.vehicles.map(vehicle => `<option value="${esc(vehicle.id)}" ${state.vehicleFilter === vehicle.id ? 'selected' : ''}>${esc(vehicle.name)}</option>`).join('')}
        </select>
      </div>
    </section>
    <section class="grid" style="margin-top:14px">
      ${records.length ? records.map(renderRecordItem).join('') : `<div class="card empty">Записей нет. Можно добавить первое ТО или ремонт.</div>`}
    </section>
  `;
}

function getFilteredRecords() {
  const needle = state.query.trim().toLowerCase();
  return [...state.records]
    .filter(item => state.typeFilter === 'Все' || item.type === state.typeFilter)
    .filter(item => state.vehicleFilter === 'Все' || item.vehicleId === state.vehicleFilter)
    .filter(item => {
      if (!needle) return true;
      const vehicle = vehicleById(item.vehicleId);
      return [item.title, item.parts, item.contractor, item.notes, item.type, item.status, vehicle?.name, vehicle?.plate]
        .join(' ').toLowerCase().includes(needle);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getUpcomingRecords() {
  return [...state.records]
    .filter(item => {
      const days = daysUntil(item.nextDate || (item.status !== 'Выполнено' ? item.date : ''));
      return item.status !== 'Выполнено' || (days !== null && days <= 30);
    })
    .sort((a, b) => new Date(a.nextDate || a.date) - new Date(b.nextDate || b.date))
    .slice(0, 8);
}

function renderRecordItem(record) {
  const vehicle = vehicleById(record.vehicleId);
  const next = daysUntil(record.nextDate);
  const isHot = next !== null && next <= 30;
  return `<article class="card compact">
    <div class="record-line">
      <div>
        <div class="pills">
          <span class="pill dark">${esc(record.type)}</span>
          <span class="pill ${record.status === 'Выполнено' ? 'ok' : 'warn'}">${esc(record.status)}</span>
          ${isHot ? `<span class="pill warn">контроль ${next < 0 ? 'просрочен' : `через ${next} дн.`}</span>` : ''}
        </div>
        <h3 style="margin-top:8px">${esc(record.title || 'Без названия')}</h3>
        <div class="muted small">${esc(vehicle?.name || 'Машина удалена')} · ${dateRu(record.date)} · пробег/мч: ${esc(record.odometer || 0)}</div>
        <div class="kv" style="margin-top:10px">
          <div><span>Запчасти</span><strong>${esc(record.parts || '—')}</strong></div>
          <div><span>Сервис / механик</span><strong>${esc(record.contractor || '—')}</strong></div>
          <div><span>Следующая дата</span><strong>${dateRu(record.nextDate)}</strong></div>
          <div><span>След. пробег/мч</span><strong>${esc(record.nextKm || '—')}</strong></div>
        </div>
        ${record.notes ? `<p class="muted small">${esc(record.notes)}</p>` : ''}
      </div>
      <div>
        <div class="money">${money(record.cost)}</div>
        <div class="inline-actions" style="margin-top:10px">
          <button class="icon-btn" data-action="edit-record" data-id="${esc(record.id)}">${icons.edit}</button>
          <button class="icon-btn danger" data-action="delete-record" data-id="${esc(record.id)}">${icons.trash}</button>
        </div>
      </div>
    </div>
  </article>`;
}

function bindMainEvents() {
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      state.tab = button.dataset.tab;
      render();
    });
  });

  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', async () => handleAction(button.dataset.action, button.dataset.id));
  });

  const search = document.querySelector('#searchInput');
  if (search) search.addEventListener('input', event => { state.query = event.target.value; render(); });
  const typeFilter = document.querySelector('#typeFilter');
  if (typeFilter) typeFilter.addEventListener('change', event => { state.typeFilter = event.target.value; render(); });
  const vehicleFilter = document.querySelector('#vehicleFilter');
  if (vehicleFilter) vehicleFilter.addEventListener('change', event => { state.vehicleFilter = event.target.value; render(); });

  const importFile = document.querySelector('#importFile');
  if (importFile) importFile.addEventListener('change', importBackup);
}

async function handleAction(action, id) {
  try {
    if (action === 'add-vehicle') return openVehicleModal();
    if (action === 'edit-vehicle') return openVehicleModal(state.vehicles.find(item => item.id === id));
    if (action === 'delete-vehicle') return deleteVehicle(id);
    if (action === 'add-record') return openRecordModal();
    if (action === 'add-record-for') return openRecordModal(null, id);
    if (action === 'edit-record') return openRecordModal(state.records.find(item => item.id === id));
    if (action === 'delete-record') return deleteRecord(id);
    if (action === 'export') return exportBackup();
    if (action === 'import') return document.querySelector('#importFile')?.click();
    if (action === 'logout') return logout();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function openVehicleModal(vehicle = null) {
  const item = vehicle || { id: '', name: '', brand: '', model: '', plate: '', year: '', vin: '', currentKm: '', notes: '' };
  openModal(vehicle ? 'Редактировать машину' : 'Добавить машину', `
    <form id="vehicleForm" class="card form-grid">
      <div class="form-grid two-col">
        ${field('name', 'Название', item.name, 'BMW X5, КамАЗ, Экскаватор')}
        ${field('plate', 'Госномер', item.plate, 'А001АА36')}
        ${field('brand', 'Марка', item.brand, 'BMW, КамАЗ, CAT')}
        ${field('model', 'Модель', item.model, 'X5, 6520, 320')}
        ${field('year', 'Год', item.year, '2021')}
        ${field('currentKm', 'Текущий пробег / моточасы', item.currentKm, '78500')}
        ${field('vin', 'VIN / серийный номер', item.vin, 'Необязательно')}
      </div>
      ${textarea('notes', 'Заметки', item.notes, 'Например: личная машина, техника на песчаном карьере')}
      <button class="btn full" type="submit">Сохранить</button>
    </form>
  `);

  document.querySelector('#vehicleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const url = vehicle ? `/api/vehicles/${vehicle.id}` : '/api/vehicles';
    const method = vehicle ? 'PUT' : 'POST';
    await api(url, { method, body: JSON.stringify(body) });
    closeModal();
    await loadData();
    render();
    toast('Машина сохранена');
  });
}

function openRecordModal(record = null, vehicleId = '') {
  if (!state.vehicles.length) {
    toast('Сначала добавь хотя бы одну машину', 'error');
    return;
  }
  const item = record || {
    id: '', vehicleId: vehicleId || state.vehicles[0].id, date: today(), type: 'ТО', odometer: '',
    title: '', parts: '', contractor: '', cost: '', nextDate: '', nextKm: '', notes: '', status: 'Выполнено'
  };

  openModal(record ? 'Редактировать работу' : 'Добавить ТО или ремонт', `
    <form id="recordForm" class="card form-grid">
      <div class="form-grid two-col">
        <label class="field">Машина
          <select name="vehicleId" required>
            ${state.vehicles.map(vehicle => `<option value="${esc(vehicle.id)}" ${vehicle.id === item.vehicleId ? 'selected' : ''}>${esc(vehicle.name)}</option>`).join('')}
          </select>
        </label>
        ${field('date', 'Дата работ', item.date, '', 'date')}
        <label class="field">Тип
          <select name="type">${TYPES.map(type => `<option ${type === item.type ? 'selected' : ''}>${esc(type)}</option>`).join('')}</select>
        </label>
        ${field('odometer', 'Пробег на момент работ / моточасы', item.odometer, '78500')}
        ${field('cost', 'Стоимость, ₽', item.cost, '28500')}
        <label class="field">Статус
          <select name="status">${STATUSES.map(status => `<option ${status === item.status ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select>
        </label>
      </div>
      ${field('title', 'Какие работы сделали', item.title, 'Замена масла, ремонт подвески, диагностика гидравлики')}
      <div class="form-grid two-col">
        ${textarea('parts', 'Какие запчасти поменяли', item.parts, 'Масло 5W-30, фильтр, колодки, ремень, артикулы')}
        ${textarea('contractor', 'Сервис / механик / подрядчик', item.contractor, 'Название сервиса, мастер, телефон')}
      </div>
      <div class="form-grid two-col">
        ${field('nextDate', 'Следующая дата контроля', item.nextDate, '', 'date')}
        ${field('nextKm', 'Следующий пробег / моточасы', item.nextKm, '88000')}
      </div>
      ${textarea('notes', 'Заметки', item.notes, 'Что проверить в следующий раз')}
      <button class="btn full" type="submit">Сохранить</button>
    </form>
  `);

  document.querySelector('#recordForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const url = record ? `/api/records/${record.id}` : '/api/records';
    const method = record ? 'PUT' : 'POST';
    await api(url, { method, body: JSON.stringify(body) });
    closeModal();
    await loadData();
    render();
    toast('Запись сохранена');
  });
}

function field(name, label, value = '', placeholder = '', type = 'text') {
  return `<label class="field">${esc(label)}<input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" placeholder="${esc(placeholder)}" /></label>`;
}

function textarea(name, label, value = '', placeholder = '') {
  return `<label class="field">${esc(label)}<textarea name="${esc(name)}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`;
}

function openModal(title, content) {
  closeModal();
  const root = document.createElement('div');
  root.className = 'modal-backdrop';
  root.id = 'modalRoot';
  root.innerHTML = `
    <section class="modal">
      <div class="modal-head">
        <h2>${esc(title)}</h2>
        <button class="icon-btn" id="modalClose" type="button">×</button>
      </div>
      ${content}
    </section>
  `;
  document.body.appendChild(root);
  document.querySelector('#modalClose').addEventListener('click', closeModal);
  root.addEventListener('click', event => {
    if (event.target === root) closeModal();
  });
}

function closeModal() {
  document.querySelector('#modalRoot')?.remove();
}

async function deleteVehicle(id) {
  const vehicle = state.vehicles.find(item => item.id === id);
  const count = state.records.filter(item => item.vehicleId === id).length;
  const text = count ? `Удалить «${vehicle?.name}» и ${count} записей по ней?` : `Удалить «${vehicle?.name}»?`;
  if (!confirm(text)) return;
  await api(`/api/vehicles/${id}`, { method: 'DELETE' });
  await loadData();
  render();
  toast('Машина удалена');
}

async function deleteRecord(id) {
  if (!confirm('Удалить запись?')) return;
  await api(`/api/records/${id}`, { method: 'DELETE' });
  await loadData();
  render();
  toast('Запись удалена');
}

function exportBackup() {
  if (STATIC_MODE) {
    const data = readStaticData();
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'auto-service-cloud-sync',
      vehicles: data.vehicles || [],
      records: data.records || [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auto-service-backup-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  window.location.href = '/api/export';
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await api('/api/import', { method: 'POST', body: JSON.stringify(data) });
    await loadData();
    render();
    toast('Импорт готов');
  } catch (error) {
    toast('Не удалось импортировать файл', 'error');
  } finally {
    event.target.value = '';
  }
}

async function logout() {
  await api('/api/logout', { method: 'POST', body: '{}' });
  state.user = null;
  renderAuth();
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  state.installEvent = event;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

boot();
