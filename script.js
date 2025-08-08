(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Theme handling
  const THEME_KEY = 'ml-theme';
  const html = document.documentElement;
  const themeToggle = $('#themeToggle');
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark') html.setAttribute('data-theme', 'dark');
  if (savedTheme === 'light') html.removeAttribute('data-theme');

  function toggleTheme() {
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem(THEME_KEY, 'dark');
    }
  }
  themeToggle?.addEventListener('click', toggleTheme);

  // Footer year
  const yearSpan = $('#year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Gentle parallax drift for formulas
  const formulas = $$('.formula');
  let lastX = 0, lastY = 0;
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 6;
    const y = (e.clientY / window.innerHeight - 0.5) * 6;
    if (Math.abs(x - lastX) < 0.2 && Math.abs(y - lastY) < 0.2) return;
    lastX = x; lastY = y;
    formulas.forEach((node, idx) => {
      node.style.transform = `translate(${x * (0.3 + idx * 0.05)}px, ${y * (0.3 + idx * 0.04)}px)`;
    });
  });

  // Daily challenge mock data
  const sampleQuestions = [
    { q: '已知函数 f(x)=x^2-2x+1，求 f(3)。', a: 'f(3)=4' },
    { q: '化简：sin^2x + cos^2x = ?', a: '1' },
    { q: '解方程：2x-6=0。', a: 'x=3' },
    { q: '等差数列首项1，公差2，第10项？', a: 'a10=19' },
    { q: '求极限：lim_{x→0} sinx/x。', a: '1' },
    { q: '矩阵[[1,0],[0,1]]的行列式？', a: '1' },
    { q: '导数：d/dx (x^3)。', a: '3x^2' },
    { q: '积分：∫_0^1 x dx。', a: '1/2' },
    { q: '概率：抛一枚公平硬币正面概率？', a: '1/2' },
    { q: '勾股定理：直角三角形斜边^2 = ?', a: '两直角边平方和' },
    { q: '函数图像 y=sinx 的周期？', a: '2π' },
    { q: '一元二次求根公式判别式？', a: 'Δ=b^2-4ac' },
  ];

  const challengeList = $('#challengeList');
  const progressBar = $('.progress-bar');
  const progressFill = $('.progress-fill');
  const progressText = $('.progress-text');
  const startQuizBtn = $('#startQuizBtn');
  const wrongBookBtn = $('#wrongBookBtn');
  const wrongBookModal = $('#wrongBookModal');
  const wrongList = $('#wrongList');

  let picked = [];
  let answeredCount = 0;
  let wrongBook = [];

  function pickRandomTen() {
    const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10).map((x) => ({ ...x }));
  }

  function renderQuestions() {
    challengeList.innerHTML = '';
    picked.forEach((item, idx) => {
      const li = document.createElement('li');
      const question = document.createElement('div');
      question.className = 'question';
      question.textContent = item.q;

      const group = document.createElement('div');
      group.className = 'answer-group';

      const btnA = document.createElement('button');
      btnA.className = 'btn btn-ghost';
      btnA.textContent = '我会';
      btnA.addEventListener('click', () => grade(idx, true, li));

      const btnB = document.createElement('button');
      btnB.className = 'btn btn-primary';
      btnB.textContent = '不会';
      btnB.addEventListener('click', () => grade(idx, false, li));

      group.append(btnA, btnB);
      li.append(question, group);
      challengeList.appendChild(li);
    });
  }

  function updateProgress() {
    const current = Math.min(answeredCount, 10);
    progressFill.style.width = `${(current / 10) * 100}%`;
    progressBar.setAttribute('aria-valuenow', String(current));
    progressText.textContent = `${current} / 10`;
  }

  function grade(index, correct, liNode) {
    if (picked[index].done) return;
    picked[index].done = true;
    answeredCount += 1;

    if (!correct) {
      const ans = document.createElement('div');
      ans.className = 'muted';
      ans.textContent = `参考：${picked[index].a}`;
      liNode.appendChild(ans);
      wrongBook.push({ ...picked[index], i: index + 1 });
      liNode.style.borderColor = '#ff9a5c';
    } else {
      liNode.style.borderColor = '#56c271';
    }

    updateProgress();
  }

  function startQuiz() {
    picked = pickRandomTen();
    answeredCount = 0;
    renderQuestions();
    updateProgress();
  }

  startQuizBtn?.addEventListener('click', startQuiz);

  wrongBookBtn?.addEventListener('click', () => {
    if (!wrongBookModal) return;
    wrongList.innerHTML = '';
    if (wrongBook.length === 0) {
      const li = document.createElement('li');
      li.textContent = '今天暂时没有错题，继续保持！';
      wrongList.appendChild(li);
    } else {
      wrongBook.forEach((w) => {
        const li = document.createElement('li');
        li.textContent = `第 ${w.i} 题：${w.q}  参考答案：${w.a}`;
        wrongList.appendChild(li);
      });
    }
    wrongBookModal.showModal();
  });

  // Auto init on load
  startQuiz();
})();