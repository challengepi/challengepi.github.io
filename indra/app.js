(() => {
  'use strict';

  const DB_NAME = 'vocabloop-db';
  const DB_VERSION = 1;
  const MIN_PER_DAY = 1440;
  const INITIAL_Z = Math.log2(6.6);
  const Z_MIN = Math.log2(0.25);
  const Z_MAX = Math.log2(3650);
  const PREF_KEY = 'vocabloop:prefs';

  const $ = s => document.querySelector(s);
  const main = $('#main');
  const pageTitle = $('#page-title');
  const toast = $('#toast');
  const liveStatus = $('#live-status');
  const dialog = $('#word-dialog');
  const form = $('#word-form');
  const importFile = $('#import-file');

  let db;
  let currentView = 'home';
  let reviewQueue = [];
  let reviewIndex = 0;
  let reviewRevealed = false;
  let reviewBusy = false;
  let reviewMode = 'due';
  let sessionReviewed = [];
  let lastUndo = null;

  const prefs = loadPrefs();

  function nowMin() { return Math.floor(Date.now() / 60000); }
  function epochDay(min = nowMin()) { return Math.floor(min / MIN_PER_DAY); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function norm(s) { return s.trim().normalize('NFKC').toLocaleLowerCase(); }
  function esc(s='') { return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function formatDue(min) {
    const delta = min - nowMin();
    if (delta <= 0) return 'Due now';
    if (delta < 60) return `in ${Math.max(1, Math.round(delta))} min`;
    if (delta < MIN_PER_DAY) return `in ${Math.round(delta / 60)} hr`;
    if (delta < MIN_PER_DAY * 2) return 'tomorrow';
    return `in ${Math.round(delta / MIN_PER_DAY)} days`;
  }
  function intervalLabel(mins) {
    if (mins < 60) return `${Math.max(1, Math.round(mins))} min`;
    if (mins < MIN_PER_DAY) return `${Math.max(1, Math.round(mins/60))} hr`;
    const d = mins / MIN_PER_DAY;
    return d < 10 ? `${d.toFixed(d < 2 ? 1 : 0)} d` : `${Math.round(d)} d`;
  }
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('show'), 1800);
    liveStatus.textContent = msg;
  }
  function loadPrefs() {
    try { return Object.assign({retention:.90, lastSession:[], reelTab:'review'}, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); }
    catch { return {retention:.90, lastSession:[], reelTab:'review'}; }
  }
  function savePrefs() { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); }

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('cards')) {
          const s = d.createObjectStore('cards', {keyPath:'id', autoIncrement:true});
          s.createIndex('due', 'd');
          s.createIndex('norm', 'n', {unique:false});
        }
        if (!d.objectStoreNames.contains('history')) d.createObjectStore('history', {keyPath:'id'});
        if (!d.objectStoreNames.contains('daily')) d.createObjectStore('daily', {keyPath:'day'});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function reqP(req) {
    return new Promise((resolve,reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function tx(storeNames, mode, fn) {
    const t = db.transaction(storeNames, mode);
    const stores = Object.fromEntries(storeNames.map(n => [n, t.objectStore(n)]));
    const done = new Promise((resolve,reject) => {
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Transaction aborted'));
    });
    const value = await fn(stores, t);
    await done;
    return value;
  }

  async function addCard(word, meaning) {
    const t = nowMin();
    const card = {w:word.trim(), m:meaning.trim(), n:norm(word), d:t, l:0, z:INITIAL_Z, r:0, p:0, q:0, s:0, c:t, u:t};
    return tx(['cards'], 'readwrite', async ({cards}) => reqP(cards.add(card)));
  }

  async function updateCard(id, word, meaning, reset=false) {
    return tx(['cards','history'], 'readwrite', async ({cards,history}) => {
      const card = await reqP(cards.get(id));
      if (!card) throw new Error('Card not found');
      card.w = word.trim(); card.m = meaning.trim(); card.n = norm(word); card.u = nowMin();
      if (reset) {
        card.d = nowMin(); card.l = 0; card.z = INITIAL_Z; card.r = 0; card.p = 0; card.q = 0; card.s = 0;
        history.delete(id);
      }
      cards.put(card);
    });
  }

  async function deleteCard(id) {
    return tx(['cards','history'], 'readwrite', async ({cards,history}) => {
      cards.delete(id); history.delete(id);
    });
  }

  async function getCard(id) { return tx(['cards'], 'readonly', async ({cards}) => reqP(cards.get(id))); }
  async function getAllCards() { return tx(['cards'], 'readonly', async ({cards}) => reqP(cards.getAll())); }
  async function getCardsByIds(ids=[]) {
    if (!ids.length) return [];
    const wanted = new Set(ids.map(Number));
    const cards = await getAllCards();
    return ids.map(id => cards.find(c => c.id === Number(id))).filter(Boolean).filter(c => wanted.has(c.id));
  }
  async function getDaily() { return tx(['daily'], 'readonly', async ({daily}) => reqP(daily.getAll())); }
  async function countCards() { return tx(['cards'], 'readonly', async ({cards}) => reqP(cards.count())); }

  async function countDue() {
    return tx(['cards'], 'readonly', async ({cards}) => reqP(cards.index('due').count(IDBKeyRange.upperBound(nowMin()))));
  }

  async function getDueCards(limit=100) {
    return tx(['cards'], 'readonly', ({cards}) => new Promise((resolve,reject) => {
      const out = [];
      const req = cards.index('due').openCursor(IDBKeyRange.upperBound(nowMin()));
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur || out.length >= limit) return resolve(out);
        out.push(cur.value); cur.continue();
      };
      req.onerror = () => reject(req.error);
    }));
  }

  async function findDuplicate(word, excludingId=0) {
    return tx(['cards'], 'readonly', ({cards}) => new Promise((resolve,reject) => {
      const req = cards.index('norm').openCursor(IDBKeyRange.only(norm(word)));
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return resolve(null);
        if (c.value.id !== excludingId) return resolve(c.value);
        c.continue();
      };
      req.onerror = () => reject(req.error);
    }));
  }

  function encodeVarint(n) {
    const a = [];
    n = Math.max(0, Math.floor(n));
    do { let b = n & 0x7f; n >>>= 7; if (n) b |= 0x80; a.push(b); } while (n);
    return a;
  }

  async function appendHistory(store, cardId, timestamp, grade) {
    const old = await reqP(store.get(cardId));
    if (!old) {
      const bytes = new Uint8Array([...encodeVarint(0), grade & 3]);
      store.put({id:cardId, b:timestamp, l:timestamp, e:bytes.buffer});
      return;
    }
    const delta = Math.max(0, timestamp - old.l);
    const extra = new Uint8Array([...encodeVarint(delta), grade & 3]);
    const prev = new Uint8Array(old.e);
    const merged = new Uint8Array(prev.length + extra.length);
    merged.set(prev); merged.set(extra, prev.length);
    old.l = timestamp; old.e = merged.buffer;
    store.put(old);
  }

  function schedulePreview(card, grade, at=nowMin()) {
    const elapsed = card.l ? Math.max(0, (at - card.l) / MIN_PER_DAY) : 1;
    const h = 2 ** card.z;
    const predicted = 2 ** (-elapsed / h);
    const observed = grade === 0 ? 0 : 1;
    const gains = [-1.25, .45, .90, 1.20];
    const z = clamp(card.z + gains[grade] + .25 * (observed - predicted), Z_MIN, Z_MAX);
    let recent = card.q || 0;
    if (grade === 0) recent = Math.min(3, recent + 1);
    else if (grade >= 2) recent = Math.max(0, recent - 1);
    if (grade === 0) return {z, due:at+10, mins:10, recent};
    const retention = clamp(prefs.retention + .02 * recent, .85, .96);
    const days = Math.max(grade === 1 ? .25 : .08, -(2 ** z) * Math.log2(retention));
    const mins = Math.max(10, Math.round(days * MIN_PER_DAY));
    return {z, due:at+mins, mins, recent};
  }

  async function reviewCard(card, grade) {
    const at = nowMin();
    const next = schedulePreview(card, grade, at);
    const before = structuredClone(card);
    card.z = next.z; card.d = next.due; card.l = at; card.r = (card.r||0)+1; card.u = at; card.q = next.recent;
    if (grade === 0) { card.p = (card.p||0)+1; card.s = 1; }
    else card.s = 2;

    let historyBefore = null;
    await tx(['cards','history','daily'], 'readwrite', async ({cards,history,daily}) => {
      historyBefore = await reqP(history.get(card.id));
      historyBefore = historyBefore ? {id:historyBefore.id,b:historyBefore.b,l:historyBefore.l,e:historyBefore.e.slice(0)} : null;
      cards.put(card);
      await appendHistory(history, card.id, at, grade);
      const day = epochDay(at);
      const ds = await reqP(daily.get(day)) || {day, r:0, ok:0, p:0};
      ds.r += 1; if (grade > 0) ds.ok += 1; else ds.p += 1;
      daily.put(ds);
    });
    lastUndo = {before, after:structuredClone(card), day:epochDay(at), grade, historyBefore};
    return next;
  }

  async function undoLast() {
    if (!lastUndo) return;
    const u = lastUndo; lastUndo = null;
    await tx(['cards','history','daily'], 'readwrite', async ({cards,history,daily}) => {
      cards.put(u.before);
      if (u.historyBefore) history.put(u.historyBefore); else history.delete(u.before.id);
      const ds = await reqP(daily.get(u.day));
      if (ds) {
        ds.r = Math.max(0, ds.r-1);
        if (u.grade > 0) ds.ok = Math.max(0, ds.ok-1); else ds.p = Math.max(0, ds.p-1);
        daily.put(ds);
      }
    });
    showToast('Last rating undone');
    await startReview();
  }

  async function render(view=currentView, options={}) {
    currentView = view;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    const titles = {home:'VocabLoop',review:'Review',reels:'Reel mode',words:'Your words',stats:'Progress',settings:'Data & privacy'};
    pageTitle.textContent = titles[view] || 'VocabLoop';
    document.body.classList.toggle('reel-view', view === 'reels');
    if (view === 'home') await renderHome();
    if (view === 'review') await startReview(options.mode || 'due', options.ids || null);
    if (view === 'reels') await renderReels(options.tab || prefs.reelTab || 'review');
    if (view === 'words') await renderWords();
    if (view === 'stats') await renderStats();
    if (view === 'settings') await renderSettings();
    main.focus({preventScroll:true});
  }

  async function renderHome() {
    const [total,due,cards,daily] = await Promise.all([countCards(),countDue(),getAllCards(),getDaily()]);
    const mature = cards.filter(c => c.r > 0);
    const avg = mature.length ? Math.round(mature.reduce((a,c)=>a + Math.min(1, Math.log2(2**c.z+1)/8),0)/mature.length*100) : 0;
    const recent = daily.filter(d => d.day >= epochDay()-6);
    const reviews = recent.reduce((a,d)=>a+d.r,0);
    const canReplay = Array.isArray(prefs.lastSession) && prefs.lastSession.length > 0;
    main.innerHTML = `
      <section class="hero">
        <p class="eyebrow">Adaptive spaced repetition</p>
        <h2>${due ? `${due} ${due===1?'word':'words'} due` : total ? 'You’re caught up' : 'Build your first deck'}</h2>
        <p>${total ? 'Words you forget will return sooner. Easy recalls gradually move farther apart.' : 'Add words and meanings. Everything stays in this browser.'}</p>
        <div class="home-action-stack">
          <div class="hero-actions">
            <button class="btn primary" id="home-review" ${due?'':'disabled'}>Start review</button>
            <button class="btn" id="home-add">+ Word</button>
          </div>
          <div class="hero-actions secondary-actions">
            <button class="btn ghost" id="home-reels" ${total?'':'disabled'}>▥ Reel mode</button>
            <button class="btn ghost" id="home-rereview" ${canReplay?'':'disabled'}>↻ Re-review</button>
          </div>
        </div>
      </section>
      <div class="grid-2">
        <div class="stat-card"><span>Saved words</span><strong>${total}</strong></div>
        <div class="stat-card"><span>Reviews · 7 days</span><strong>${reviews}</strong></div>
        <div class="stat-card"><span>Due now</span><strong>${due}</strong></div>
        <div class="stat-card"><span>Memory strength</span><strong>${avg}%</strong></div>
      </div>
      <section class="section">
        <div class="section-head"><h2>How it adapts</h2><p>local only</p></div>
        <div class="list-panel">
          <div class="setting-row"><span><strong>Forgotten</strong><small>Returns in minutes, then stays on a tighter schedule.</small></span><b>↺</b></div>
          <div class="setting-row"><span><strong>Remembered</strong><small>Half-life grows and the next review moves further away.</small></span><b>↗</b></div>
        </div>
      </section>`;
    $('#home-review')?.addEventListener('click', () => render('review'));
    $('#home-add')?.addEventListener('click', () => openWordDialog());
    $('#home-reels')?.addEventListener('click', () => render('reels'));
    $('#home-rereview')?.addEventListener('click', () => render('review', {mode:'rereview', ids:prefs.lastSession}));
  }

  async function startReview(mode='due', ids=null) {
    reviewMode = mode;
    if (mode === 'rereview') {
      reviewQueue = await getCardsByIds(ids?.length ? ids : prefs.lastSession || []);
      if (!reviewQueue.length) reviewQueue = (await getAllCards()).slice(0,100);
    } else {
      reviewQueue = await getDueCards(100);
      sessionReviewed = [];
    }
    reviewIndex = 0;
    reviewRevealed = false;
    reviewBusy = false;
    await renderReviewCard();
  }

  async function skipReviewCard() {
    if (reviewBusy || reviewQueue.length < 2) return;
    reviewIndex = (reviewIndex + 1) % reviewQueue.length;
    reviewRevealed = false;
    await renderReviewCard();
  }

  function persistLastSession() {
    if (!sessionReviewed.length) return;
    prefs.lastSession = [...new Set(sessionReviewed)].slice(-100);
    savePrefs();
  }

  async function finishPracticeCard(card, repeat=false) {
    const at = reviewQueue.findIndex(c => c.id === card.id);
    if (at < 0) return;
    reviewQueue.splice(at, 1);
    if (repeat) reviewQueue.push(card);
    if (reviewIndex >= reviewQueue.length) reviewIndex = 0;
    reviewRevealed = false;
    await renderReviewCard();
  }

  async function renderReviewCard() {
    const dueTotal = reviewMode === 'due' ? await countDue() : 0;
    if (reviewIndex >= reviewQueue.length) reviewIndex = 0;
    const card = reviewQueue[reviewIndex];
    if (!card) {
      if (reviewMode === 'due' && dueTotal) {
        reviewQueue = await getDueCards(100);
        reviewIndex = 0;
        if (reviewQueue.length) return renderReviewCard();
      }
      if (reviewMode === 'due') persistLastSession();
      const replayIds = reviewMode === 'rereview' ? (prefs.lastSession || []) : (sessionReviewed.length ? sessionReviewed : (prefs.lastSession || []));
      main.innerHTML = `<div class="empty review-complete">
        <div class="complete-icon">✓</div>
        <h2>${reviewMode === 'rereview' ? 'Re-review complete' : 'Review complete'}</h2>
        <p>${reviewMode === 'rereview' ? 'Practice replay does not change your spaced-repetition schedule.' : 'The scheduler will surface each word again when it is useful.'}</p>
        <div class="complete-actions">
          ${replayIds.length ? '<button class="btn primary" id="review-again">↻ Re-review session</button>' : ''}
          <button class="btn" id="review-reels">▥ Open Reel mode</button>
          <button class="btn ghost" id="review-done">Back home</button>
        </div>
      </div>`;
      $('#review-again')?.addEventListener('click', () => render('review', {mode:'rereview', ids:replayIds}));
      $('#review-reels')?.addEventListener('click', () => render('reels'));
      $('#review-done')?.addEventListener('click', () => render('home'));
      return;
    }
    const previews = [0,1,2,3].map(g => schedulePreview(card,g));
    const practice = reviewMode === 'rereview';
    main.innerHTML = `
      <div class="review-wrap">
        <div class="review-top">
          <span>${reviewIndex+1} / ${reviewQueue.length}${practice ? ' · practice replay' : ` · ${dueTotal} due`}</span>
          <button class="review-skip" id="review-skip" type="button" ${reviewQueue.length < 2 ? 'disabled' : ''}>Next word →</button>
        </div>
        ${practice ? '<div class="practice-note">↻ Re-review mode · ratings here do not change your schedule</div>' : ''}
        <article class="review-card" aria-live="polite">
          <p class="word">${esc(card.w)}</p>
          ${reviewRevealed ? `<div class="meaning">${esc(card.m)}</div>` : `<p class="hint">Try to recall the meaning before revealing it.</p>`}
        </article>
        <div class="review-actions">
          ${!reviewRevealed ? `<div class="review-primary-actions"><button class="btn primary" id="reveal">Reveal meaning</button>${reviewQueue.length > 1 ? '<button class="btn" id="review-skip-bottom">Skip</button>' : ''}</div>` : practice ? `
          <div class="practice-grid">
            <button class="rating again" data-practice="again"><strong>Again soon</strong><small>Put it at the end</small></button>
            <button class="rating easy" data-practice="got"><strong>Got it</strong><small>Continue</small></button>
          </div>` : `
          <div class="rating-grid">
            <button class="rating again" data-grade="0"><strong>Again</strong><small>${intervalLabel(previews[0].mins)}</small></button>
            <button class="rating" data-grade="1"><strong>Hard</strong><small>${intervalLabel(previews[1].mins)}</small></button>
            <button class="rating" data-grade="2"><strong>Good</strong><small>${intervalLabel(previews[2].mins)}</small></button>
            <button class="rating easy" data-grade="3"><strong>Easy</strong><small>${intervalLabel(previews[3].mins)}</small></button>
          </div>`}
        </div>
      </div>`;

    $('#reveal')?.addEventListener('click', () => { reviewRevealed = true; renderReviewCard(); });
    $('#review-skip')?.addEventListener('click', skipReviewCard);
    $('#review-skip-bottom')?.addEventListener('click', skipReviewCard);

    document.querySelectorAll('[data-practice]').forEach(btn => btn.addEventListener('click', () => finishPracticeCard(card, btn.dataset.practice === 'again')));
    document.querySelectorAll('.rating[data-grade]').forEach(btn => btn.addEventListener('click', async () => {
      if (reviewBusy) return;
      reviewBusy = true;
      document.querySelectorAll('.rating').forEach(b => b.disabled = true);
      try {
        const grade = Number(btn.dataset.grade);
        const next = await reviewCard(card, grade);
        sessionReviewed.push(card.id);
        showToast(`Next review: ${intervalLabel(next.mins)}`);
        const reviewedAt = reviewQueue.findIndex(c => c.id === card.id);
        if (reviewedAt >= 0) reviewQueue.splice(reviewedAt, 1);
        if (reviewIndex >= reviewQueue.length) reviewIndex = 0;
        reviewRevealed = false;
        await renderReviewCard();
      } catch (err) {
        console.error(err);
        showToast('Could not save that review. Try again.');
        document.querySelectorAll('.rating').forEach(b => b.disabled = false);
      } finally {
        reviewBusy = false;
      }
    }));

    const cardEl = document.querySelector('.review-card');
    if (cardEl && reviewQueue.length > 1) {
      let startX = 0, startY = 0;
      cardEl.addEventListener('touchstart', e => {
        const t = e.changedTouches[0]; startX = t.clientX; startY = t.clientY;
      }, {passive:true});
      cardEl.addEventListener('touchend', e => {
        const t = e.changedTouches[0];
        const dx = t.clientX - startX, dy = t.clientY - startY;
        if (dx < -70 && Math.abs(dx) > Math.abs(dy) * 1.25) skipReviewCard();
      }, {passive:true});
    }
  }

  async function renderReels(tab='review') {
    prefs.reelTab = tab === 'add' ? 'add' : 'review';
    savePrefs();
    const cards = tab === 'review' ? await getDueCards(100) : [];
    main.innerHTML = `
      <div class="reel-shell">
        <div class="reel-toolbar" role="tablist" aria-label="Reel mode">
          <button class="reel-tab ${tab==='review'?'active':''}" data-reel-tab="review" role="tab">Review</button>
          <button class="reel-tab ${tab==='add'?'active':''}" data-reel-tab="add" role="tab">Add</button>
        </div>
        ${tab === 'review' ? renderReviewReelsMarkup(cards) : renderAddReelMarkup()}
      </div>`;
    document.querySelectorAll('[data-reel-tab]').forEach(b => b.addEventListener('click', () => renderReels(b.dataset.reelTab)));
    if (tab === 'review') bindReviewReels(cards); else bindAddReel();
  }

  function renderReviewReelsMarkup(cards) {
    if (!cards.length) return `<div class="reel-empty reel-panel"><div><p class="eyebrow">All caught up</p><h2>No words are due</h2><p>Your scheduled review is complete. You can replay your last session or add more words.</p><div class="complete-actions"><button class="btn primary" id="reel-rereview" ${prefs.lastSession?.length?'':'disabled'}>↻ Re-review last session</button><button class="btn" id="reel-switch-add">+ Add words</button></div></div></div>`;
    return `<div class="reel-feed" id="reel-feed" aria-label="Swipe vertically through due words">
      ${cards.map((card,i) => {
        const previews=[0,1,2,3].map(g=>schedulePreview(card,g));
        return `<section class="reel-card" data-card-id="${card.id}" aria-label="Word ${i+1} of ${cards.length}">
          <div class="reel-progress"><span>${i+1} / ${cards.length}</span><span>Swipe ↑↓</span></div>
          <div class="reel-content">
            <p class="eyebrow">Due review</p>
            <h2 class="reel-word">${esc(card.w)}</h2>
            <button class="reel-reveal" type="button">Tap to reveal</button>
            <div class="reel-meaning hidden">${esc(card.m)}</div>
          </div>
          <div class="reel-rating hidden">
            <button class="mini-rating again" data-grade="0"><strong>Again</strong><small>${intervalLabel(previews[0].mins)}</small></button>
            <button class="mini-rating" data-grade="1"><strong>Hard</strong><small>${intervalLabel(previews[1].mins)}</small></button>
            <button class="mini-rating" data-grade="2"><strong>Good</strong><small>${intervalLabel(previews[2].mins)}</small></button>
            <button class="mini-rating easy" data-grade="3"><strong>Easy</strong><small>${intervalLabel(previews[3].mins)}</small></button>
          </div>
        </section>`;
      }).join('')}
      <section class="reel-card reel-end"><div class="reel-content"><p class="eyebrow">End of feed</p><h2>That’s the current queue</h2><p class="muted">Rated cards are saved immediately. Unrated cards remain due.</p><div class="complete-actions"><button class="btn primary" id="reel-refresh">Refresh due words</button><button class="btn" id="reel-add-end">+ Add a word</button></div></div></section>
    </div>`;
  }

  function renderAddReelMarkup() {
    return `<div class="reel-feed add-feed" id="reel-add-feed">
      <section class="reel-card add-reel">
        <form id="reel-add-form" class="reel-add-form">
          <div class="reel-progress"><span>New word</span><span>Save & keep adding</span></div>
          <div class="reel-content add-content">
            <p class="eyebrow">Add reel</p>
            <label><span>Word</span><input id="reel-word" maxlength="120" required autocomplete="off" autocapitalize="none" placeholder="ephemeral" /></label>
            <label><span>Meaning</span><textarea id="reel-meaning" maxlength="1200" rows="6" required placeholder="lasting for a very short time"></textarea></label>
            <div id="reel-duplicate" class="note hidden"></div>
          </div>
          <button class="reel-save" type="submit">Save word <span>↑</span></button>
        </form>
      </section>
      <section class="reel-card add-tip"><div class="reel-content"><p class="eyebrow">Fast capture</p><h2>Add one, then another.</h2><p class="muted">After saving, the form clears so you can keep building your deck without leaving Reel Mode.</p><button class="btn primary" id="add-tip-back">Back to add form</button></div></section>
    </div>`;
  }

  function bindReviewReels(cards) {
    $('#reel-rereview')?.addEventListener('click', () => render('review', {mode:'rereview', ids:prefs.lastSession}));
    $('#reel-switch-add')?.addEventListener('click', () => renderReels('add'));
    $('#reel-refresh')?.addEventListener('click', () => renderReels('review'));
    $('#reel-add-end')?.addEventListener('click', () => renderReels('add'));
    document.querySelectorAll('.reel-card[data-card-id]').forEach(cardEl => {
      const card = cards.find(c => c.id === Number(cardEl.dataset.cardId));
      if (!card) return;
      const reveal = cardEl.querySelector('.reel-reveal');
      const meaning = cardEl.querySelector('.reel-meaning');
      const rating = cardEl.querySelector('.reel-rating');
      reveal.addEventListener('click', () => {
        reveal.classList.add('hidden'); meaning.classList.remove('hidden'); rating.classList.remove('hidden');
      });
      cardEl.querySelectorAll('.mini-rating').forEach(btn => btn.addEventListener('click', async () => {
        if (cardEl.dataset.busy === '1') return;
        cardEl.dataset.busy = '1';
        cardEl.querySelectorAll('.mini-rating').forEach(b => b.disabled = true);
        try {
          const next = await reviewCard(card, Number(btn.dataset.grade));
          sessionReviewed.push(card.id);
          persistLastSession();
          showToast(`Saved · next ${intervalLabel(next.mins)}`);
          const nextCard = cardEl.nextElementSibling;
          cardEl.classList.add('rated');
          setTimeout(() => nextCard?.scrollIntoView({behavior:'smooth', block:'start'}), 120);
        } catch (err) {
          cardEl.dataset.busy = '0';
          cardEl.querySelectorAll('.mini-rating').forEach(b => b.disabled = false);
          showToast('Could not save that review');
        }
      }));
    });
  }

  function bindAddReel() {
    $('#add-tip-back')?.addEventListener('click', () => $('#reel-add-form')?.scrollIntoView({behavior:'smooth', block:'start'}));
    const form = $('#reel-add-form');
    if (!form) return;
    const word = $('#reel-word'), meaning = $('#reel-meaning'), note = $('#reel-duplicate');
    word.addEventListener('input', async () => {
      const w = word.value.trim();
      if (!w) return note.classList.add('hidden');
      const dup = await findDuplicate(w);
      note.classList.toggle('hidden', !dup);
      if (dup) note.textContent = `“${dup.w}” is already in your deck.`;
    });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const w=word.value.trim(), m=meaning.value.trim();
      if (!w || !m) return;
      const dup=await findDuplicate(w);
      if (dup) { note.textContent=`“${dup.w}” is already in your deck.`; note.classList.remove('hidden'); return; }
      try {
        await addCard(w,m);
        word.value=''; meaning.value=''; note.classList.add('hidden');
        showToast('Word added · ready for the next one');
        word.focus();
      } catch { showToast('Could not save this word'); }
    });
    setTimeout(() => word.focus(), 80);
  }

  async function renderWords(query='') {
    const cards = await getAllCards();
    main.innerHTML = `
      <input class="search" id="word-search" placeholder="Search ${cards.length} words" value="${esc(query)}" aria-label="Search words" />
      <div id="word-results"></div>`;
    const search = $('#word-search');
    const paint = q => {
      const filtered = cards.filter(c => !q || c.n.includes(norm(q)) || c.m.toLocaleLowerCase().includes(q.toLocaleLowerCase())).sort((a,b)=>a.w.localeCompare(b.w));
      const box = $('#word-results');
      box.innerHTML = filtered.length ? `<div class="word-list">${filtered.slice(0,300).map(c => `
        <button class="word-row" data-id="${c.id}">
          <span><strong>${esc(c.w)}</strong><p>${esc(c.m)}</p></span>
          <span class="badge">${formatDue(c.d)}</span>
        </button>`).join('')}</div>${filtered.length>300?'<p class="muted">Showing first 300 matches.</p>':''}` : `<div class="empty" style="margin-top:12px"><h2>No words found</h2><p>Add a new word or change your search.</p></div>`;
      box.querySelectorAll('.word-row').forEach(b => b.addEventListener('click', () => openWordDialog(Number(b.dataset.id))));
    };
    paint(query);
    search.addEventListener('input', e => paint(e.target.value));
  }

  async function renderStats() {
    const [cards,daily] = await Promise.all([getAllCards(),getDaily()]);
    const last30 = daily.filter(d => d.day >= epochDay()-29);
    const reviews = last30.reduce((a,d)=>a+d.r,0);
    const ok = last30.reduce((a,d)=>a+d.ok,0);
    const lapses = last30.reduce((a,d)=>a+d.p,0);
    const recall = reviews ? Math.round(ok/reviews*100) : 0;
    const attention = cards.filter(c => (c.p||0)>=3).sort((a,b)=>(b.p||0)-(a.p||0)).slice(0,8);
    main.innerHTML = `
      <div class="grid-2" style="margin-top:0">
        <div class="stat-card"><span>Recall · 30 days</span><strong>${recall}%</strong></div>
        <div class="stat-card"><span>Target retention</span><strong>${Math.round(prefs.retention*100)}%</strong></div>
        <div class="stat-card"><span>Reviews</span><strong>${reviews}</strong></div>
        <div class="stat-card"><span>Forgotten</span><strong>${lapses}</strong></div>
      </div>
      <section class="section">
        <div class="section-head"><h2>Needs attention</h2><p>${attention.length} lapse-heavy</p></div>
        ${attention.length ? `<div class="word-list">${attention.map(c=>`<button class="word-row" data-id="${c.id}"><span><strong>${esc(c.w)}</strong><p>${esc(c.m)}</p></span><span class="badge">${c.p} lapses</span></button>`).join('')}</div>` : `<div class="empty"><h2>No problem words yet</h2><p>Cards with repeated forgetting will show here.</p></div>`}
      </section>`;
    document.querySelectorAll('.word-row').forEach(b => b.addEventListener('click', () => openWordDialog(Number(b.dataset.id))));
  }

  async function storageInfo() {
    if (!navigator.storage?.estimate) return null;
    try {
      const e = await navigator.storage.estimate();
      return {usage:e.usage||0, quota:e.quota||0, persisted: navigator.storage.persisted ? await navigator.storage.persisted() : false};
    } catch { return null; }
  }

  function humanBytes(n) {
    if (!n) return '0 KB';
    if (n < 1024*1024) return `${Math.max(1, Math.round(n/1024))} KB`;
    return `${(n/1024/1024).toFixed(1)} MB`;
  }

  async function renderSettings() {
    const info = await storageInfo();
    main.innerHTML = `
      <div class="list-panel">
        <button class="setting-row" id="retention-row"><span><strong>Target retention</strong><small>Higher = more frequent reviews. Default is 90%.</small></span><b>${Math.round(prefs.retention*100)}%</b></button>
        <button class="setting-row" id="persist-row"><span><strong>Persistent browser storage</strong><small>${info?.persisted ? 'Browser reports this origin as persistent.' : 'Ask the browser to reduce automatic eviction risk.'}</small></span><b>${info?.persisted?'On':'Request'}</b></button>
        <div class="setting-row"><span><strong>Estimated site storage</strong><small>Includes database and cached app files; browser estimates are approximate.</small></span><b>${info?humanBytes(info.usage):'—'}</b></div>
      </div>
      <section class="section">
        <div class="section-head"><h2>Backup</h2><p>your data, your file</p></div>
        <div class="list-panel">
          <button class="setting-row" id="export"><span><strong>Export backup</strong><small>Downloads a versioned backup; gzip is used when supported.</small></span><b>↓</b></button>
          <button class="setting-row" id="import"><span><strong>Import backup</strong><small>Replaces this browser’s current deck after validation.</small></span><b>↑</b></button>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><h2>Privacy</h2><p>no account</p></div>
        <div class="list-panel">
          <div class="setting-row"><span><strong>Local-only by design</strong><small>No vocabulary sync, analytics, login, or third-party scripts.</small></span><b>✓</b></div>
          <button class="setting-row" id="erase"><span><strong class="danger-text">Erase all local data</strong><small>This permanently removes cards, review state, and statistics from this origin.</small></span><b class="danger-text">×</b></button>
        </div>
      </section>`;
    $('#retention-row').addEventListener('click', () => cycleRetention());
    $('#persist-row').addEventListener('click', requestPersistence);
    $('#export').addEventListener('click', exportBackup);
    $('#import').addEventListener('click', () => importFile.click());
    $('#erase').addEventListener('click', eraseAll);
  }

  function cycleRetention() {
    const vals = [.85,.88,.90,.92,.94,.96];
    const i = vals.findIndex(x => Math.abs(x-prefs.retention)<.001);
    prefs.retention = vals[(i+1)%vals.length]; savePrefs();
    showToast(`Target retention ${Math.round(prefs.retention*100)}%`); renderSettings();
  }

  async function requestPersistence() {
    if (!navigator.storage?.persist) return showToast('Persistence API is not available here');
    const ok = await navigator.storage.persist();
    showToast(ok ? 'Persistent storage granted' : 'Browser did not grant persistence');
    renderSettings();
  }

  async function openWordDialog(id=0) {
    const title = $('#word-dialog-title');
    const resetRow = $('#reset-row');
    const deleteBtn = $('#delete-word');
    $('#reset-learning').checked = false;
    $('#duplicate-note').classList.add('hidden');
    if (id) {
      const c = await getCard(id); if (!c) return;
      $('#word-id').value = id; $('#word-input').value = c.w; $('#meaning-input').value = c.m;
      title.textContent = 'Edit word'; resetRow.classList.remove('hidden'); deleteBtn.classList.remove('hidden');
    } else {
      $('#word-id').value = ''; $('#word-input').value = ''; $('#meaning-input').value = '';
      title.textContent = 'Add word'; resetRow.classList.add('hidden'); deleteBtn.classList.add('hidden');
    }
    dialog.showModal();
    setTimeout(() => $('#word-input').focus(), 30);
  }

  async function onSaveWord(e) {
    e.preventDefault();
    const id = Number($('#word-id').value || 0);
    const w = $('#word-input').value.trim();
    const m = $('#meaning-input').value.trim();
    if (!w || !m) return;
    const dup = await findDuplicate(w, id);
    if (dup) {
      const note = $('#duplicate-note'); note.textContent = `“${dup.w}” already exists. Change the spelling or edit the existing card.`; note.classList.remove('hidden'); return;
    }
    try {
      if (id) await updateCard(id, w, m, $('#reset-learning').checked);
      else await addCard(w,m);
      dialog.close(); showToast(id ? 'Word updated' : 'Word added');
      await render(currentView === 'review' ? 'home' : currentView);
    } catch (err) {
      showToast(err?.name === 'QuotaExceededError' ? 'Browser storage is full. Export a backup.' : 'Could not save this word');
    }
  }

  async function exportBackup() {
    const [cards,histories,daily] = await Promise.all([
      getAllCards(),
      tx(['history'],'readonly', async ({history}) => reqP(history.getAll())),
      getDaily()
    ]);
    const pack = {
      magic:'VOCABLOOP1', version:1, createdAt:new Date().toISOString(), prefs:{retention:prefs.retention}, cards,
      histories: histories.map(h => ({id:h.id,b:h.b,l:h.l,e:bytesToBase64(new Uint8Array(h.e))})), daily
    };
    const json = JSON.stringify(pack);
    let blob, ext;
    if ('CompressionStream' in window) {
      const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
      blob = await new Response(stream).blob(); ext = 'json.gz';
    } else { blob = new Blob([json],{type:'application/json'}); ext='json'; }
    downloadBlob(blob, `vocabloop-backup-${new Date().toISOString().slice(0,10)}.${ext}`);
    showToast('Backup exported');
  }

  async function importBackup(file) {
    let text;
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const gz = bytes[0] === 0x1f && bytes[1] === 0x8b;
    if (gz) {
      if (!('DecompressionStream' in window)) throw new Error('This browser cannot read gzip backups');
      const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
      text = await new Response(stream).text();
    } else text = new TextDecoder().decode(bytes);
    const pack = JSON.parse(text);
    if (pack.magic !== 'VOCABLOOP1' || pack.version !== 1 || !Array.isArray(pack.cards)) throw new Error('Invalid VocabLoop backup');
    if (!confirm(`Replace this browser’s current data with ${pack.cards.length} imported words?`)) return;
    await tx(['cards','history','daily'],'readwrite', async ({cards,history,daily}) => {
      cards.clear(); history.clear(); daily.clear();
      for (const c of pack.cards) cards.put(c);
      for (const h of (pack.histories||[])) history.put({id:h.id,b:h.b,l:h.l,e:base64ToBytes(h.e).buffer});
      for (const d of (pack.daily||[])) daily.put(d);
    });
    if (pack.prefs?.retention) { prefs.retention = pack.prefs.retention; savePrefs(); }
    showToast('Backup restored');
    await render('home');
  }

  function bytesToBase64(bytes) {
    let s=''; const chunk=0x8000;
    for (let i=0;i<bytes.length;i+=chunk) s += String.fromCharCode(...bytes.subarray(i,i+chunk));
    return btoa(s);
  }
  function base64ToBytes(b64) {
    const s=atob(b64), a=new Uint8Array(s.length); for(let i=0;i<s.length;i++) a[i]=s.charCodeAt(i); return a;
  }
  function downloadBlob(blob,name) {
    const a=document.createElement('a'); const url=URL.createObjectURL(blob); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  async function eraseAll() {
    if (!confirm('Erase all VocabLoop words and review data from this browser? This cannot be undone.')) return;
    await tx(['cards','history','daily'],'readwrite', async ({cards,history,daily}) => { cards.clear(); history.clear(); daily.clear(); });
    showToast('Local data erased'); render('home');
  }

  document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => render(b.dataset.view)));
  $('#quick-add').addEventListener('click', () => openWordDialog());
  $('#word-cancel').addEventListener('click', () => dialog.close());
  $('#delete-word').addEventListener('click', async () => {
    const id = Number($('#word-id').value || 0);
    if (!id || !confirm('Delete this word and its review history?')) return;
    await deleteCard(id); dialog.close(); showToast('Word deleted'); await render(currentView === 'review' ? 'home' : currentView);
  });
  form.addEventListener('submit', onSaveWord);
  $('#word-input').addEventListener('input', async e => {
    const id = Number($('#word-id').value||0), note=$('#duplicate-note');
    const w=e.target.value.trim(); if (!w) return note.classList.add('hidden');
    const dup=await findDuplicate(w,id); note.classList.toggle('hidden',!dup); if (dup) note.textContent=`Possible duplicate: “${dup.w}”`;
  });
  importFile.addEventListener('change', async e => {
    const file=e.target.files[0]; e.target.value=''; if (!file) return;
    try { await importBackup(file); } catch(err) { showToast(err.message || 'Import failed'); }
  });

  document.addEventListener('keydown', async e => {
    if (dialog.open || currentView !== 'review') return;
    if (!reviewRevealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); reviewRevealed=true; renderReviewCard(); return; }
    if (reviewRevealed && ['1','2','3','4'].includes(e.key)) document.querySelector(`.rating[data-grade="${Number(e.key)-1}"]`)?.click();
    if (e.key.toLowerCase() === 'u' && lastUndo) await undoLast();
  });

  async function init() {
    try {
      db = await openDB();
      await render('home');
      if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
    } catch (err) {
      main.innerHTML = `<div class="empty"><h2>Storage unavailable</h2><p>VocabLoop needs browser IndexedDB. Try a normal browser tab on an HTTP/HTTPS origin.</p></div>`;
      console.error(err);
    }
  }

  init();
})();
