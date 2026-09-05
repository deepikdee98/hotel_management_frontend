const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
// Exercise the actual TypeScript service with only its HTTP transport stubbed.
function loadService(apiRequest) {
  const source = fs.readFileSync(path.join(__dirname, '../services/api/admin-notifications.service.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { exports: module.exports, module, require: () => ({ apiRequest }) });
  return module.exports;
}
const announcement = { _id: 'a1', title: 'System update', message: 'Announcement', type: 'general', createdAt: '2026-09-05T01:00:00Z' };
const activity = { id: 's1', title: 'Guest checked out', message: 'Staff checked out Guest', type: 'staff-activity', isRead: false, createdAt: '2026-09-05T02:00:00Z' };
test('combines nested announcements and flat activity without losing the total unread count', async () => {
  const service = loadService(async url => url === '/admin/notifications'
    ? { success: true, data: { notifications: [{ isRead: false, notification: announcement }] } }
    : { success: true, data: [activity], unreadCount: 72 });
  const result = await service.loadAdminNotifications();
  assert.equal(result.unreadCount, 73);
  assert.equal(result.items[0].id, 'activity:s1');
  assert.equal(result.items[1].id, 'announcement:a1');
  assert.equal(result.warning, '');
});
test('uses the correct PATCH read/archive endpoints for each notification source', async () => {
  const calls = [];
  const service = loadService(async (url, options) => { calls.push([url, options.method]); return { success: true }; });
  await service.updateAdminNotification('activity:s1', 'read');
  await service.updateAdminNotification('announcement:a1', 'archive');
  assert.deepEqual(calls, [['/admin/staff-activity/notifications/s1/read', 'PATCH'], ['/admin/notifications/a1/archive', 'PATCH']]);
  await assert.rejects(service.updateAdminNotification('invalid', 'read'));
  assert.equal(calls.length, 2);
});
test('preserves announcements during a staff API outage and reports incomplete results', async () => {
  const service = loadService(async url => {
    if (url !== '/admin/notifications') throw new Error('Unavailable');
    return { success: true, data: { notifications: [{ isRead: true, notification: announcement }] } };
  });
  const result = await service.loadAdminNotifications();
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, 'announcement:a1');
  assert.match(result.warning, /Staff notifications/);
});
test('fails visibly if both APIs fail or return invalid data', async () => {
  const service = loadService(async () => ({ success: false, data: [] }));
  await assert.rejects(service.loadAdminNotifications(), /could not be loaded/);
});
test('limits display to latest 50 entries while preserving server unread total', async () => {
  const items = Array.from({ length: 60 }, (_, i) => ({ ...activity, id: String(i), createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString() }));
  const service = loadService(async url => url === '/admin/notifications'
    ? { success: true, data: { notifications: [] } }
    : { success: true, data: items, unreadCount: 100 });
  const result = await service.loadAdminNotifications();
  assert.equal(result.items.length, 50);
  assert.equal(result.items[0].id, 'activity:59');
  assert.equal(result.unreadCount, 100);
});
