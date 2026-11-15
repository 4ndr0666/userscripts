// Mock ChatGPT backend for the real-browser integration fixture.
// Installed BEFORE the userscript so the script's fetch patch wraps this mock,
// exactly like it wraps the real page's fetch on chatgpt.com.
(() => {
  'use strict';
  const state = { sent: 0 };
  window.__fixture = state;

  const CONV = '12345678-1234-4123-8123-123456789abc';
  const IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const threadOf = () => {
    const mapping = {}; let prev = null;
    for (let i = 0; i < state.sent; i++) {
      const u = `u${i}`, a = `a${i}`, t = `t${i}`;
      mapping[u] = { ...(prev ? { parent: prev } : {}), message: { author: { role: 'user' }, content: { parts: ['fixture red panda'] } } };
      mapping[a] = { parent: u, message: { author: { role: 'assistant' }, status: 'finished_successfully',
        content: { parts: [{ content_type: 'image_asset_pointer', asset_pointer: 'file-service://file-fx' + i }] }, end_turn: true } };
      mapping[t] = { parent: a, message: { author: { role: 'assistant' }, status: 'finished_successfully',
        content: { parts: ['Here is your image.'] }, end_turn: true } };
      prev = t;
    }
    return { current_node: prev, mapping };
  };

  window.fetch = async (input, init = {}) => {
    const u = new URL(String(typeof input === 'string' ? input : input.url), location.href);
    const json = (payload) => new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (u.pathname === '/api/auth/session') return json({ accessToken: 'fixture-token' });
    if (u.pathname === '/backend-api/models') return json({ versions: [
      { id: 'fx-alpha', enabled: true, display_text_full: 'Fixture Alpha', slugs: ['fx-alpha-slug'], intelligence_presets: [{ title: 'High', model_slug: 'fx-alpha-high', thinking_effort: 'high' }] }] });
    if (u.pathname === '/backend-api/conversation/init') return json({
      limits_progress: [{ feature_name: 'image_gen', remaining: 9, reset_after: null }],
      model_limits: [], blocked_features: [] });
    if (u.pathname === '/backend-api/conversation/' + CONV) return json(threadOf());
    if (u.pathname.startsWith('/backend-api/files/download/')) return json({ download_url: IMG });
    if (u.pathname === '/backend-api/f/conversation') { window.__fixture.posted = JSON.parse(init.body); return json({ conversation_id: CONV }); }
    return json({});
  };

  // ChatGPT-side behavior: Send posts the message, shows Stop while "generating".
  document.getElementById('send-btn').addEventListener('click', () => {
    state.sent++;
    window.fetch('/backend-api/f/conversation', { method: 'POST', body: JSON.stringify({ model: 'fx-alpha-slug', messages: [] }) });
    const stop = document.createElement('button');
    stop.setAttribute('aria-label', 'Stop'); stop.id = 'stop-btn';
    document.body.appendChild(stop);
    history.pushState({}, '', '/c/' + CONV);
    setTimeout(() => stop.remove(), 400);
  });
})();
