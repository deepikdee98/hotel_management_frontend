const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, globals = {}) {
 const module = { exports: {} };
 const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
 const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 vm.runInNewContext(compiled, { module, exports: module.exports, URLSearchParams, ...globals });
 return module.exports;
}
const query = { preset: 'today', startDate: '2026-01-01', endDate: '2026-01-02', propertyIds: ['p1', 'p2'], page: 3, limit: 25, search: '  guest & name  ', sort: 'amount', order: 'desc', filters: { status: 'paid', staff: 's1', unexpected: 'unsafe' } };
test('query retains authorized report filters, property scope and sort; excludes stale custom dates', () => {
 const service = load('services/api/reports.service.ts', { require: () => ({}) });
 const params = service.reportQuery(query, ['status']);
 assert.equal(params.get('status'), 'paid'); assert.equal(params.get('staff'), null); assert.equal(params.get('unexpected'), null);
 assert.equal(params.get('startDate'), null); assert.equal(params.get('propertyIds'), 'p1,p2');
 assert.equal(params.get('search'), 'guest & name'); assert.equal(params.get('page'), '3'); assert.equal(params.get('order'), 'desc');
});
test('export matches custom range and filters but omits table pagination', async () => {
 let url;
 const blob = new Blob(['report']);
 const service = load('services/api/reports.service.ts', { require: () => ({ apiBlobRequest: async value => { url = value; return blob; } }) });
 assert.equal(await service.exportReport({ id: 'guest/list', filters: ['status'] }, { ...query, preset: 'custom' }, 'xlsx'), blob);
 assert.ok(url.startsWith('/reports/export/guest%2Flist?'));
 const params = new URLSearchParams(url.split('?')[1]);
 assert.equal(params.get('startDate'), '2026-01-01'); assert.equal(params.get('endDate'), '2026-01-02');
 assert.equal(params.get('format'), 'xlsx'); assert.equal(params.get('page'), null); assert.equal(params.get('limit'), null);
 assert.equal(params.get('status'), 'paid'); assert.equal(params.get('propertyIds'), 'p1,p2');
});
test('filter option lookup encodes report, property scope, filter and search', async () => {
 let url;
 const service = load('services/api/reports.service.ts', { require: () => ({ apiRequest: async value => { url = value; return { data: { options: [], hasMore: false } }; } }) });
 const result = await service.getReportFilterOptions({ id: 'guest/list' }, 'room', ['p1', 'p2'], '  10 & 2  ');
 assert.deepEqual(result, { options: [], hasMore: false });
 assert.ok(url.startsWith('/reports/options/guest%2Flist?'));
 const params = new URLSearchParams(url.split('?')[1]);
 assert.equal(params.get('filter'), 'room'); assert.equal(params.get('propertyIds'), 'p1,p2'); assert.equal(params.get('search'), '10 & 2');
});
test('binary transport retains authentication and active property and refreshes expired tokens', async () => {
 const calls = [];
 const storage = new Map([['hotel_manager_tokens', JSON.stringify({ accessToken: 'old', refreshToken: 'refresh' })]]);
 const core = load('services/api/core.ts', {
 process: { env: { NEXT_PUBLIC_BACKEND_URL: 'http://test' } },
 window: { localStorage: { getItem: () => 'property-1' }, location: {} },
 sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
 fetch: async (url, init) => { calls.push([url, init]); if (url.endsWith('/auth/refresh')) return new Response(JSON.stringify({ accessToken: 'new' })); if (init.headers.Authorization === 'Bearer old') return new Response('{}', { status: 401 }); return new Response('csv contents'); },
 });
 assert.equal(await (await core.apiBlobRequest('/reports/export/revenue?format=csv')).text(), 'csv contents');
 assert.equal(calls.length, 3); assert.equal(calls[2][1].headers.Authorization, 'Bearer new');
 assert.equal(calls[2][1].headers['X-Property-Id'], 'property-1'); assert.equal(calls[2][1].cache, 'no-store');
});
test('binary transport surfaces server export limits instead of downloading an error file', async () => {
 const core = load('services/api/core.ts', { process: { env: {} }, fetch: async () => new Response(JSON.stringify({ message: 'Narrow your date range' }), { status: 422 }) });
 await assert.rejects(core.apiBlobRequest('/reports/export/revenue?format=pdf'), /Narrow your date range/);
});
test('shared service retains existing staff, night audit, modules and promotion APIs', () => {
 const service = load('services/api/reports.service.ts', { require: () => ({}) });
 for (const name of ['getStaffDashboard', 'runNightAudit', 'getNightAuditStatus', 'getAvailableModules', 'getHotelPromotions', 'getSuperAdminProfile']) assert.equal(typeof service[name], 'function', name);
});
test('multi-property dates use each property timezone and mixed metadata falls back to UTC', () => {
 const format = load('components/reports/report-format.ts');
 const meta = { timezone: 'Per property', properties: [{ id: 'p1', name: 'East hotel', timezone: 'Asia/Kolkata' }, { id: 'p2', name: 'West hotel', timezone: 'America/New_York' }] };
 assert.equal(format.rowReportTimezone({ property: 'East hotel' }, meta), 'Asia/Kolkata');
 assert.equal(format.rowReportTimezone({ property: 'West hotel' }, meta), 'America/New_York');
 assert.equal(format.rowReportTimezone({ property: 'Unknown' }, meta), 'UTC');
 const timestamp = '2026-09-06T01:00:00Z';
 assert.equal(format.formatReportValue(timestamp, 'date', null, 'Per property'), new Date(timestamp).toLocaleString(undefined, { timeZone: 'UTC' }));
 assert.notEqual(format.formatReportValue(timestamp, 'date', null, 'Asia/Kolkata'), format.formatReportValue(timestamp, 'date', null, 'America/New_York'));
});
test('invalid currencies and non-finite amounts do not crash reporting', () => {
 const format = load('components/reports/report-format.ts');
 assert.equal(format.formatReportValue(123, 'money', 'invalid'), '123 (invalid)');
 assert.equal(format.formatReportValue(NaN, 'money', 'USD'), '—');
 assert.match(format.formatReportValue(123, 'money', 'USD'), /123/);
});
test('housekeeping staff inputs request names while audit and room inputs request identifiers', () => {
 const format = load('components/reports/report-format.ts');
 for (const id of ['housekeeping-daily', 'room-assignment', 'pending-cleaning', 'room-inspection', 'maintenance', 'deep-cleaning']) assert.equal(format.reportFilterLabel(id, 'staff'), 'Assigned staff name');
 assert.equal(format.reportFilterLabel('staff-activity', 'staff'), 'Staff');
 assert.equal(format.reportFilterLabel('reservations', 'room'), 'Room');
});
