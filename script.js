/* Utilities */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
  });
}

function clamp(num, min, max) { return Math.min(Math.max(num, min), max); }

/* Init basics */
$('#year').textContent = String(new Date().getFullYear());
$('#todayDate').textContent = formatDate(new Date());

/* Smooth jump */
$$('.btn[data-jump], .top-nav a').forEach(el => {
  el.addEventListener('click', (e) => {
    const target = el.getAttribute('data-jump') || el.getAttribute('href');
    if (target?.startsWith('#')) {
      e.preventDefault();
      document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* Progress tracking */
const PROGRESS_KEYS = ['vocab','listening','speaking','reading','writing'];
const STORAGE_PROGRESS = 'lingolift_progress_v1';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_PROGRESS)) || {}; } catch { return {}; }
}
function saveProgress(state) { localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(state)); }

function updateProgressUI() {
  const state = loadProgress();
  const done = PROGRESS_KEYS.filter(k => state[k]).length;
  const pct = Math.round((done / PROGRESS_KEYS.length) * 100);
  $('#progressInner').style.width = pct + '%';
  $('#progressText').textContent = pct + '%';
}

function bindPlanCheckboxes() {
  const state = loadProgress();
  $$('#planList input[type="checkbox"]').forEach(cb => {
    const key = cb.dataset.progress;
    cb.checked = !!state[key];
    cb.addEventListener('change', () => {
      state[key] = cb.checked;
      saveProgress(state);
      updateProgressUI();
    });
  });
}

bindPlanCheckboxes();
updateProgressUI();

/* Vocabulary section */
const DAILY_WORDS = [
  { word: 'resilient', phonetic: '/rɪˈzɪliənt/', meaning: 'able to recover quickly from difficulties', example: 'She remained resilient in the face of challenges.' },
  { word: 'meticulous', phonetic: '/məˈtɪkjʊləs/', meaning: 'very careful and precise', example: 'He kept meticulous notes during the experiment.' },
  { word: 'coherent', phonetic: '/kəʊˈhɪərənt/', meaning: 'logical and consistent', example: 'Her argument was coherent and persuasive.' },
  { word: 'alleviate', phonetic: '/əˈliːvieɪt/', meaning: 'make less severe', example: 'This medicine may alleviate your symptoms.' },
  { word: 'ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', meaning: 'present everywhere', example: 'Smartphones are ubiquitous nowadays.' },
  { word: 'pragmatic', phonetic: '/præɡˈmætɪk/', meaning: 'practical rather than theoretical', example: 'We need a pragmatic solution to this problem.' },
];

const STORAGE_WORDLIST = 'lingolift_my_words_v1';
function loadWordList() { try { return JSON.parse(localStorage.getItem(STORAGE_WORDLIST)) || []; } catch { return []; } }
function saveWordList(list) { localStorage.setItem(STORAGE_WORDLIST, JSON.stringify(list)); }

function ttsSpeak(text, rate = 1) {
  const synth = window.speechSynthesis;
  if (!synth) { alert('Speech Synthesis not supported in this browser.'); return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = clamp(rate, 0.6, 1.4);
  synth.cancel();
  synth.speak(utter);
}

function renderVocab() {
  const wrap = $('#vocabCards');
  wrap.innerHTML = '';
  const myList = new Set(loadWordList());
  DAILY_WORDS.forEach((w) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="title">${w.word} <span class="muted">${w.phonetic}</span></div>
      <div>${w.meaning}</div>
      <div class="example">“${w.example}”</div>
      <div class="card-actions">
        <button class="btn btn-primary" data-action="pronounce">🔊 Pronounce</button>
        <button class="btn" data-action="example">▶ Play Example</button>
        <button class="btn btn-accent" data-action="save">${myList.has(w.word) ? '✓ Added' : 'Add to list'}</button>
      </div>
    `;
    card.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'pronounce') {
        ttsSpeak(w.word, 1);
      } else if (action === 'example') {
        ttsSpeak(`${w.word}. ${w.example}`, 0.95);
      } else if (action === 'save') {
        const list = loadWordList();
        if (!list.includes(w.word)) list.push(w.word);
        saveWordList(list);
        btn.textContent = '✓ Added';
        markProgress('vocab');
      }
    });
    wrap.appendChild(card);
  });
}

renderVocab();

function markProgress(key) {
  const state = loadProgress();
  if (!state[key]) {
    state[key] = true;
    saveProgress(state);
    updateProgressUI();
    // also tick checkbox if exists
    const cb = $(`#planList input[data-progress="${key}"]`);
    if (cb) cb.checked = true;
  }
}

/* Listening section */
const LISTEN_SAMPLE_TEXT = 'Technology is transforming education, making learning more accessible and engaging.';
const rateSlider = $('#listenRate');
const rateLabel = $('#listenRateValue');
rateSlider.addEventListener('input', () => {
  rateLabel.textContent = rateSlider.value + 'x';
});

$('#listenPlay').addEventListener('click', () => {
  ttsSpeak(LISTEN_SAMPLE_TEXT, parseFloat(rateSlider.value));
});

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
}

$('#dictationCheck').addEventListener('click', () => {
  const typed = normalize($('#dictationInput').value);
  const truth = normalize(LISTEN_SAMPLE_TEXT);
  if (!typed) { $('#dictationScore').textContent = 'Type your answer first'; return; }
  const typedWords = typed.split(' ');
  const truthWords = truth.split(' ');
  let correct = 0;
  const set = new Set(truthWords);
  typedWords.forEach(w => { if (set.has(w)) correct++; });
  const precision = correct / Math.max(typedWords.length, 1);
  const recall = correct / Math.max(truthWords.length, 1);
  const f1 = (2 * precision * recall) / Math.max(precision + recall, 0.0001);
  const score = Math.round(f1 * 100);
  $('#dictationScore').textContent = `Score: ${score}/100`;
  if (score >= 60) markProgress('listening');
});

/* Speaking section */
const chatLog = $('#chatLog');
function addMsg(text, who = 'ai') {
  const div = document.createElement('div');
  div.className = `msg ${who}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

const ROLEPLAY_PROMPTS = [
  { ai: 'Hello! Welcome to the cafe. What would you like to order?', expectedKeywords: ['coffee','tea','latte','cappuccino'] },
  { ai: 'Would you like anything to eat with that?', expectedKeywords: ['sandwich','cake','cookie','muffin'] },
  { ai: 'Great choice! Is that for here or to go?', expectedKeywords: ['here','to go','takeaway'] },
];
let turnIndex = 0;
addMsg(ROLEPLAY_PROMPTS[0].ai, 'ai');

function provideFeedback(userText, expectedKeywords) {
  const text = normalize(userText);
  const hits = expectedKeywords.filter(k => text.includes(k));
  const ratio = hits.length / expectedKeywords.length;
  let comment = `Keywords matched: ${hits.join(', ') || 'none'}`;
  if (ratio >= 0.6) comment += ' • Nice!';
  else if (ratio >= 0.3) comment += ' • Getting there.';
  else comment += ' • Try mentioning a specific item.';
  $('#speakingFeedback').textContent = comment;
  if (ratio >= 0.5) markProgress('speaking');
}

function aiRespond() {
  turnIndex = Math.min(turnIndex + 1, ROLEPLAY_PROMPTS.length - 1);
  addMsg(ROLEPLAY_PROMPTS[turnIndex].ai, 'ai');
}

function onSend(text) {
  if (!text) return;
  addMsg(text, 'me');
  provideFeedback(text, ROLEPLAY_PROMPTS[turnIndex].expectedKeywords);
  setTimeout(aiRespond, 600);
}

$('#sendBtn').addEventListener('click', () => onSend($('#chatInput').value.trim()));
$('#chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onSend($('#chatInput').value.trim()); $('#chatInput').value = ''; } });

// Speech recognition (if supported)
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    $('#chatInput').value = transcript;
    onSend(transcript);
  };
}

$('#micBtn').addEventListener('click', () => {
  if (!recognition) { alert('Speech Recognition not supported in this browser.'); return; }
  recognition.start();
});

/* Reading section */
const ARTICLES = [
  {
    title: 'Morning Routines for Productivity',
    body: 'A consistent morning routine can significantly improve your productivity. Start with light exercise and a healthy breakfast. Avoid distractions and focus on your top priorities.',
    newWords: ['consistent','significantly','priorities']
  },
  {
    title: 'Learning with Technology',
    body: 'Digital tools provide access to courses worldwide. However, balance screen time with offline practice to reinforce new skills and knowledge.',
    newWords: ['digital','reinforce','knowledge']
  }
];

function renderArticles() {
  const wrap = $('#articleList');
  wrap.innerHTML = '';
  ARTICLES.forEach(a => {
    const article = document.createElement('article');
    article.className = 'article';
    const highlighted = a.body.split(' ').map(w => {
      const plain = w.replace(/[^a-zA-Z]/g, '');
      if (a.newWords.includes(plain.toLowerCase())) {
        return `<span class="new" data-word="${plain}">${w}</span>`;
      }
      return w;
    }).join(' ');
    article.innerHTML = `<h3>${a.title}</h3><p>${highlighted}</p>`;
    wrap.appendChild(article);
  });

  wrap.addEventListener('click', (e) => {
    const el = e.target.closest('.new');
    if (el) {
      const word = el.dataset.word;
      const def = lookupDictionary(word);
      showToast(`${word}: ${def}`);
      markProgress('reading');
    }
  });
}

renderArticles();

/* Writing section */
function simpleCorrection(text) {
  const suggestions = [];
  if (!text) return { score: 0, tips: ['Write something to get feedback.'] };
  // Capitalize first letter
  if (text[0] && text[0] === text[0].toLowerCase()) suggestions.push('Capitalize the first letter of your paragraph.');
  // Double spaces
  if (/\s{2,}/.test(text)) suggestions.push('Avoid using multiple spaces.');
  // Basic punctuation spacing
  if (/\w,[^\s]/.test(text)) suggestions.push('Add a space after commas.');
  // Overuse of very
  if (/\bvery\b/gi.test(text)) suggestions.push('Consider replacing "very" with a stronger adjective.');
  // Length
  if (text.split(/\s+/).length < 20) suggestions.push('Try writing at least 2-3 sentences.');
  const score = clamp(100 - suggestions.length * 12, 40, 100);
  return { score, tips: suggestions.length ? suggestions : ['Looks good! Minor improvements only.'] };
}

$('#correctBtn').addEventListener('click', () => {
  const text = $('#writingInput').value.trim();
  const result = simpleCorrection(text);
  $('#correctionOutput').innerHTML = `<strong>Score: ${result.score}/100</strong><ul>${result.tips.map(t => `<li>${t}</li>`).join('')}</ul>`;
  if (result.score >= 70) markProgress('writing');
});

/* Grammar section */
const GRAMMAR = [
  { title: 'Present Perfect', body: 'Form: have/has + past participle. Use for experiences and actions with present relevance.' },
  { title: 'Conditionals', body: 'Zero, First, Second, Third. Match form to likelihood and time reference.' },
  { title: 'Articles (a/an/the)', body: 'Use a/an for non-specific; the for specific or previously mentioned nouns.' },
  { title: 'Gerunds vs Infinitives', body: 'Some verbs take gerunds (enjoy doing), others infinitives (want to do).' },
  { title: 'Passive Voice', body: 'Be + past participle. Focus on the action or receiver rather than the doer.' },
  { title: 'Reported Speech', body: 'Shift tenses when reporting past statements (e.g., present → past).' },
];

function renderGrammar() {
  const grid = $('#grammarGrid');
  grid.innerHTML = '';
  GRAMMAR.forEach(g => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="title">${g.title}</div><div class="example">${g.body}</div>`;
    grid.appendChild(card);
  });
}
renderGrammar();

/* Community feed */
const FEED = [
  { user: 'Ava', text: 'Completed 3 listening exercises today!', avatar: 'https://picsum.photos/seed/ava/64/64' },
  { user: 'Ben', text: 'Learned 15 new words about travel ✈️', avatar: 'https://picsum.photos/seed/ben/64/64' },
  { user: 'Chen', text: 'Wrote a paragraph and got it corrected.', avatar: 'https://picsum.photos/seed/chen/64/64' },
];

function renderFeed() {
  const wrap = $('#feed');
  wrap.innerHTML = '';
  FEED.forEach(item => {
    const row = document.createElement('div');
    row.className = 'feed-item';
    row.innerHTML = `<img src="${item.avatar}" alt="${item.user}"><div class="bubble"><strong>${item.user}</strong><div class="muted">${item.text}</div></div>`;
    wrap.appendChild(row);
  });
}
renderFeed();

/* Leaderboard */
const LEADERS = [
  { name: 'Ava', points: 320 },
  { name: 'Diego', points: 290 },
  { name: 'Chen', points: 260 },
  { name: 'Mina', points: 240 },
  { name: 'Liam', points: 210 },
];

function renderLeaderboard() {
  const ol = $('#leaderboardList');
  ol.innerHTML = '';
  LEADERS.forEach(l => {
    const li = document.createElement('li');
    li.textContent = `${l.name} — ${l.points} pts`;
    ol.appendChild(li);
  });
}
renderLeaderboard();

/* Mistake notebook */
function renderMistakes() {
  const list = JSON.parse(localStorage.getItem('lingolift_mistakes_v1') || '[]');
  const ul = $('#mistakeList');
  ul.innerHTML = '';
  list.forEach((m, idx) => {
    const li = document.createElement('li');
    li.className = 'mistake-item';
    li.innerHTML = `<div><strong>Mistake:</strong> ${m.text}</div><div><strong>Correction:</strong> ${m.fix}</div>`;
    ul.appendChild(li);
  });
}

$('#mistakeForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('#mistakeText').value.trim();
  const fix = $('#mistakeFix').value.trim();
  if (!text || !fix) return;
  const list = JSON.parse(localStorage.getItem('lingolift_mistakes_v1') || '[]');
  list.push({ text, fix, ts: Date.now() });
  localStorage.setItem('lingolift_mistakes_v1', JSON.stringify(list));
  $('#mistakeText').value = '';
  $('#mistakeFix').value = '';
  renderMistakes();
});
renderMistakes();

/* Tools: dictionary */
const MINI_DICTIONARY = {
  resilient: 'able to recover quickly from difficulties',
  consistent: 'acting or done in the same way over time',
  priorities: 'things that are regarded as more important than others',
  reinforce: 'strengthen or support',
  knowledge: 'facts, information, and skills acquired through experience or education',
  pragmatic: 'dealing with things sensibly and realistically',
};

function lookupDictionary(word) {
  if (!word) return 'Enter a word to search.';
  const key = word.toLowerCase();
  return MINI_DICTIONARY[key] || 'Definition not found (placeholder).';
}

$('#dictSearch').addEventListener('click', () => {
  const q = $('#dictQuery').value.trim();
  $('#dictResult').textContent = lookupDictionary(q);
});

/* Tools: translation (placeholder) */
function fakeTranslate(text, lang) {
  if (!text) return 'Enter text to translate.';
  const map = { zh: '（占位）这是翻译结果。', es: '(placeholder) Esta es una traducción.', ja: '（プレースホルダー）これは翻訳です。', fr: '(espace réservé) Ceci est une traduction.' };
  return `${map[lang] || '(placeholder) Translation'}\n\n${text}`;
}

$('#translateBtn').addEventListener('click', () => {
  const text = $('#translateInput').value.trim();
  const lang = $('#translateLang').value;
  $('#translateOutput').textContent = fakeTranslate(text, lang);
});

/* Tools: calendar */
function buildCalendar(el) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();
  const startDay = first.getDay();

  const studied = new Set(JSON.parse(localStorage.getItem('lingolift_studied_days_v1') || '[]'));

  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  el.innerHTML = '';
  weekdays.forEach(d => {
    const div = document.createElement('div');
    div.className = 'day header';
    div.textContent = d;
    el.appendChild(div);
  });

  for (let i = 0; i < startDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'day';
    blank.style.visibility = 'hidden';
    el.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${month+1}-${d}`;
    const div = document.createElement('div');
    div.className = 'day' + (studied.has(key) ? ' studied' : '');
    div.textContent = String(d);
    div.addEventListener('click', () => {
      if (studied.has(key)) { studied.delete(key); div.classList.remove('studied'); }
      else { studied.add(key); div.classList.add('studied'); }
      localStorage.setItem('lingolift_studied_days_v1', JSON.stringify(Array.from(studied)));
    });
    el.appendChild(div);
  }
}

buildCalendar($('#calendar'));

/* Toast helper */
let toastTimer;
function showToast(text) {
  let toast = $('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      background: '#111827', color: '#fff', padding: '10px 14px', borderRadius: '10px', zIndex: 40,
      boxShadow: '0 10px 30px rgba(0,0,0,.15)'
    });
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}