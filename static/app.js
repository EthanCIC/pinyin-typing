// ============================================================
// Pinyin Learning System — Frontend
// ============================================================

const API = {
    async get(url) {
        const r = await fetch(url);
        return r.json();
    },
    async post(url, data) {
        const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return r.json();
    }
};

// ============================================================
// App State
// ============================================================
const App = {
    mappings: null,
    progress: null,
    currentView: 'phase1',
    phase1: {
        mode: 'typing',        // 'typing' | 'recognition'
        group: 'all_initials',
        items: [],
        current: 0,
        correct: 0,
        wrong: 0,
        mistakes: [],
        startTime: null,
    },
    phase2: { rule: 'u-rule', quizItems: [], current: 0, correct: 0, wrong: 0 },
    phase3: { items: [], current: 0, correct: 0, wrong: 0, startTime: null },
    phase4: { items: [], current: 0, correct: 0, wrong: 0 },
    phase5: { duration: 60, timer: null, timeLeft: 0, total: 0, correct: 0, items: [], current: 0 },
};

// ============================================================
// Init
// ============================================================
async function init() {
    App.mappings = await API.get('/api/mappings');
    App.progress = await API.get('/api/progress');
    initGamification();
    setupNav();
    setupPhase1();
    setupPhase2();
    setupPhase3();
    setupPhase4();
    setupPhase5();
}

// ============================================================
// Navigation
// ============================================================
function setupNav() {
    // Top navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const view = tab.dataset.view;
            switchView(view);
        });
    });

    // Bottom navigation (mobile)
    document.querySelectorAll('.bottom-nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.bottom-nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const view = tab.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    App.currentView = view;
    if (view === 'dashboard') loadDashboard();
    if (view === 'phase3') startPhase3();
    if (view === 'phase4') startPhase4();
}

// ============================================================
// Gamification: XP and Streak
// ============================================================
function initGamification() {
    // Load from localStorage
    const xp = localStorage.getItem('pinyin_xp') || 0;
    const streak = localStorage.getItem('pinyin_streak') || 0;
    const lastVisit = localStorage.getItem('pinyin_last_visit');

    // Update streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let currentStreak = parseInt(streak);
    if (lastVisit === yesterday) {
        currentStreak += 1;
    } else if (lastVisit !== today) {
        currentStreak = 1;
    }

    // Save and display
    localStorage.setItem('pinyin_xp', xp);
    localStorage.setItem('pinyin_streak', currentStreak);
    localStorage.setItem('pinyin_last_visit', today);

    document.getElementById('xp-total').textContent = xp;
    document.getElementById('streak-days').textContent = currentStreak;
}

function addXP(amount) {
    const currentXP = parseInt(localStorage.getItem('pinyin_xp') || 0);
    const newXP = currentXP + amount;
    localStorage.setItem('pinyin_xp', newXP);
    document.getElementById('xp-total').textContent = newXP;

    // Add celebration animation
    const xpBar = document.getElementById('xp-bar');
    xpBar.style.animation = 'celebrate 0.6s ease';
    setTimeout(() => {
        xpBar.style.animation = '';
    }, 600);
}

// ============================================================
// Phase 1: Initials & Finals
// ============================================================
function setupPhase1() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            App.phase1.mode = btn.dataset.mode;
            startPhase1Session();
        });
    });

    // Group buttons
    document.querySelectorAll('#group-selector .group-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#group-selector .group-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            App.phase1.group = btn.dataset.group;
            startPhase1Session();
        });
    });

    // Input handler
    document.getElementById('pinyin-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') handlePhase1Input();
    });

    // Restart button
    document.getElementById('btn-restart').addEventListener('click', startPhase1Session);

    startPhase1Session();
}

function getPhase1Items(group) {
    const m = App.mappings;
    if (group === 'all_initials') return m.initials.map(i => ({ ...i, type: 'initial' }));
    if (group === 'all_finals') return m.finals.map(i => ({ ...i, type: 'final' }));
    // Filter by group name
    const initials = m.initials.filter(i => i.group === group).map(i => ({ ...i, type: 'initial' }));
    const finals = m.finals.filter(i => i.group === group).map(i => ({ ...i, type: 'final' }));
    return [...initials, ...finals];
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startPhase1Session() {
    const items = getPhase1Items(App.phase1.group);
    if (items.length === 0) return;

    App.phase1.items = shuffle(items);
    App.phase1.current = 0;
    App.phase1.correct = 0;
    App.phase1.wrong = 0;
    App.phase1.mistakes = [];
    App.phase1.startTime = Date.now();

    document.getElementById('practice-area').style.display = '';
    document.getElementById('session-summary').style.display = 'none';

    if (App.phase1.mode === 'typing') {
        document.getElementById('typing-input-area').style.display = '';
        document.getElementById('recognition-area').style.display = 'none';
    } else {
        document.getElementById('typing-input-area').style.display = 'none';
        document.getElementById('recognition-area').style.display = '';
    }

    showPhase1Card();
}

function showPhase1Card() {
    const p = App.phase1;
    if (p.current >= p.items.length) {
        finishPhase1Session();
        return;
    }

    const item = p.items[p.current];
    document.getElementById('card-zhuyin').textContent = item.zhuyin;
    document.getElementById('card-hint').textContent = '';
    document.getElementById('card').className = 'card';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('recognition-feedback').textContent = '';
    document.getElementById('recognition-feedback').className = 'feedback';

    const pct = (p.current / p.items.length * 100).toFixed(0);
    document.getElementById('progress-bar').style.width = pct + '%';
    document.getElementById('progress-text').textContent = `${p.current} / ${p.items.length}`;
    updatePhase1Stats();

    if (App.phase1.mode === 'typing') {
        const inp = document.getElementById('pinyin-input');
        inp.value = '';
        inp.className = 'pinyin-input';
        inp.focus();
    } else {
        showRecognitionOptions(item);
    }
}

function showRecognitionOptions(correctItem) {
    const allItems = App.phase1.group.startsWith('all_') ?
        [...App.mappings.initials, ...App.mappings.finals] :
        getPhase1Items(App.phase1.group);

    // Pick 3 wrong options
    const wrongPool = allItems.filter(i => i.pinyin !== correctItem.pinyin);
    const wrongOptions = shuffle(wrongPool).slice(0, 3);
    const options = shuffle([correctItem, ...wrongOptions]);

    const container = document.getElementById('options');
    container.innerHTML = '';
    options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="key-hint">${i + 1}</span>${opt.pinyin}`;
        btn.dataset.pinyin = opt.pinyin;
        btn.addEventListener('click', () => handleRecognitionChoice(opt.pinyin, correctItem));
        container.appendChild(btn);
    });

    // Keyboard shortcuts 1-4
    App._recogHandler = (e) => {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < options.length) {
            handleRecognitionChoice(options[idx].pinyin, correctItem);
        }
    };
    document.addEventListener('keydown', App._recogHandler);
}

function handleRecognitionChoice(chosen, correctItem) {
    document.removeEventListener('keydown', App._recogHandler);

    const isCorrect = chosen === correctItem.pinyin;
    const p = App.phase1;

    // Highlight buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        if (btn.dataset.pinyin === correctItem.pinyin) btn.classList.add('correct');
        else if (btn.dataset.pinyin === chosen && !isCorrect) btn.classList.add('wrong');
        btn.style.pointerEvents = 'none';
    });

    if (isCorrect) {
        p.correct++;
        addXP(5); // Award XP for correct answer
        document.getElementById('card').classList.add('correct');
        document.getElementById('recognition-feedback').textContent = '正確！';
        document.getElementById('recognition-feedback').className = 'feedback correct';
    } else {
        p.wrong++;
        p.mistakes.push({ zhuyin: correctItem.zhuyin, expected: correctItem.pinyin, got: chosen });
        document.getElementById('card').classList.add('wrong');
        document.getElementById('recognition-feedback').textContent = `正確答案：${correctItem.pinyin}`;
        document.getElementById('recognition-feedback').className = 'feedback wrong';
    }

    submitReview(correctItem.pinyin, correctItem.type || 'initial', isCorrect);
    setTimeout(() => { p.current++; showPhase1Card(); }, isCorrect ? 600 : 1500);
}

function handlePhase1Input() {
    const inp = document.getElementById('pinyin-input');
    const answer = inp.value.trim().toLowerCase();
    if (!answer) return;

    const p = App.phase1;
    const item = p.items[p.current];
    const isCorrect = answer === item.pinyin.toLowerCase();

    if (isCorrect) {
        p.correct++;
        addXP(5); // Award XP for correct answer
        inp.className = 'pinyin-input correct';
        document.getElementById('card').classList.add('correct');
        document.getElementById('feedback').textContent = '正確！';
        document.getElementById('feedback').className = 'feedback correct';
    } else {
        p.wrong++;
        p.mistakes.push({ zhuyin: item.zhuyin, expected: item.pinyin, got: answer });
        inp.className = 'pinyin-input wrong';
        document.getElementById('card').classList.add('wrong');
        document.getElementById('feedback').textContent = `正確答案：${item.pinyin}`;
        document.getElementById('feedback').className = 'feedback wrong';
        document.getElementById('card-hint').textContent = item.hint || '';
    }

    submitReview(item.pinyin, item.type || 'initial', isCorrect);
    setTimeout(() => { p.current++; showPhase1Card(); }, isCorrect ? 500 : 1800);
}

function updatePhase1Stats() {
    const p = App.phase1;
    const elapsed = Math.floor((Date.now() - (p.startTime || Date.now())) / 1000);
    document.getElementById('stat-correct').textContent = `✓ ${p.correct}`;
    document.getElementById('stat-wrong').textContent = `✗ ${p.wrong}`;
    document.getElementById('stat-time').textContent = `⏱ ${elapsed}s`;
}

function finishPhase1Session() {
    const p = App.phase1;
    const elapsed = Math.floor((Date.now() - p.startTime) / 1000);
    const total = p.correct + p.wrong;
    const accuracy = total > 0 ? Math.round(p.correct / total * 100) : 0;

    document.getElementById('practice-area').style.display = 'none';
    document.getElementById('session-summary').style.display = '';

    document.getElementById('summary-total').textContent = total;
    document.getElementById('summary-correct').textContent = p.correct;
    document.getElementById('summary-wrong').textContent = p.wrong;
    document.getElementById('summary-accuracy').textContent = accuracy + '%';
    document.getElementById('summary-time').textContent = elapsed + 's';

    const mistakesDiv = document.getElementById('summary-mistakes');
    if (p.mistakes.length > 0) {
        mistakesDiv.innerHTML = '<h4>需要加強的項目：</h4>' +
            p.mistakes.map(m => `<div class="mistake-item"><span>${m.zhuyin} → ${m.expected}</span><span style="color:var(--wrong)">你輸入：${m.got}</span></div>`).join('');
    } else {
        mistakesDiv.innerHTML = '<p style="color:var(--correct)">全部正確！太棒了！</p>';
    }

    API.post('/api/session', { phase: 1, mode: p.mode, duration: elapsed, total, correct: p.correct });
}

async function submitReview(itemId, itemType, correct) {
    await API.post('/api/review', { item_id: itemId, item_type: itemType, correct, quality: correct ? 5 : 1 });
}

// ============================================================
// Phase 2: Special Rules
// ============================================================
const RULES = {
    'u-rule': {
        title: 'ü 的拼寫規則',
        content: `
            <h3>ü 的拼寫規則</h3>
            <p>ㄩ (ü) 在不同聲母後面的寫法不同：</p>
            <table>
                <tr><th>聲母</th><th>寫法</th><th>範例</th></tr>
                <tr><td>j, q, x, y</td><td>寫成 <span class="example">u</span>（省略兩點）</td><td>ju, qu, xu, yu</td></tr>
                <tr><td>n, l</td><td>保留 <span class="example">ü</span>（加兩點）</td><td>nü, lü</td></tr>
            </table>
            <p>記憶口訣：<strong>j, q, x, y 見到 ü，兩點省略不用寫</strong></p>
            <p>所以：ㄐㄩ = <span class="example">ju</span>（不是 <span class="wrong-example">jü</span>）</p>
            <p>但是：ㄋㄩ = <span class="example">nü</span>（不能寫成 <span class="wrong-example">nu</span>，因為 nu 是 ㄋㄨ）</p>
        `,
        quiz: [
            { q: 'ㄐㄩ 的拼音是？', options: ['ju', 'jü', 'jv', 'ji'], answer: 'ju', explain: 'j 後面的 ü 省略兩點寫成 u' },
            { q: 'ㄋㄩ 的拼音是？', options: ['nu', 'nü', 'nv', 'ni'], answer: 'nü', explain: 'n 後面的 ü 必須保留兩點' },
            { q: 'ㄑㄩ 的拼音是？', options: ['qü', 'qu', 'qv', 'qi'], answer: 'qu', explain: 'q 後面的 ü 省略兩點' },
            { q: 'ㄌㄩ 的拼音是？', options: ['lu', 'lü', 'lv', 'li'], answer: 'lü', explain: 'l 後面的 ü 必須保留兩點' },
            { q: 'ㄒㄩㄢ 的拼音是？', options: ['xüan', 'xuan', 'xvan', 'xian'], answer: 'xuan', explain: 'x 後面的 ü 省略兩點' },
            { q: 'ㄩ 單獨成音節時寫成？', options: ['yu', 'ü', 'wu', 'yi'], answer: 'yu', explain: 'ü 單獨時前面加 y，寫成 yu' },
        ]
    },
    'whole-syllable': {
        title: '整體認讀音節',
        content: `
            <h3>整體認讀音節</h3>
            <p>這些音節需要整體記憶，不是聲母+韻母的簡單拼合：</p>
            <table>
                <tr><th>注音</th><th>拼音</th><th>說明</th></tr>
                <tr><td>ㄓ</td><td>zhi</td><td>翹舌音獨立成音節</td></tr>
                <tr><td>ㄔ</td><td>chi</td><td>翹舌音獨立成音節</td></tr>
                <tr><td>ㄕ</td><td>shi</td><td>翹舌音獨立成音節</td></tr>
                <tr><td>ㄖ</td><td>ri</td><td>翹舌音獨立成音節</td></tr>
                <tr><td>ㄗ</td><td>zi</td><td>平舌音獨立成音節</td></tr>
                <tr><td>ㄘ</td><td>ci</td><td>平舌音獨立成音節</td></tr>
                <tr><td>ㄙ</td><td>si</td><td>平舌音獨立成音節</td></tr>
                <tr><td>ㄧ</td><td>yi</td><td>加 y</td></tr>
                <tr><td>ㄨ</td><td>wu</td><td>加 w</td></tr>
                <tr><td>ㄩ</td><td>yu</td><td>加 y，省略兩點</td></tr>
            </table>
            <p>關鍵：zhi/chi/shi/ri/zi/ci/si 中的 i <strong>不是</strong>真正的 ㄧ，只是拼寫需要。</p>
        `,
        quiz: [
            { q: '「知」的拼音是？', options: ['zhi', 'zi', 'zh', 'ji'], answer: 'zhi', explain: 'ㄓ 獨立成音節時寫 zhi' },
            { q: '「吃」的拼音是？', options: ['ci', 'chi', 'ch', 'qi'], answer: 'chi', explain: 'ㄔ 獨立成音節時寫 chi' },
            { q: '「日」的拼音是？', options: ['ri', 'r', 'rhi', 'li'], answer: 'ri', explain: 'ㄖ 獨立成音節時寫 ri' },
            { q: '「四」的拼音是？', options: ['shi', 'si', 'sz', 'xi'], answer: 'si', explain: 'ㄙ 獨立成音節時寫 si（不是 shi）' },
            { q: '「魚」的拼音是？', options: ['ü', 'yu', 'wu', 'yi'], answer: 'yu', explain: 'ㄩ 獨立成音節時寫 yu' },
        ]
    },
    'tone-placement': {
        title: '聲調標記位置',
        content: `
            <h3>聲調符號標在哪裡？</h3>
            <p>規則：<strong>a > e > o；遇到 iu/ui 標後面那個</strong></p>
            <table>
                <tr><th>情況</th><th>規則</th><th>範例</th></tr>
                <tr><td>有 a</td><td>標在 a 上</td><td>h<span class="example">ǎ</span>o, l<span class="example">á</span>i</td></tr>
                <tr><td>有 e</td><td>標在 e 上</td><td>m<span class="example">é</span>i, l<span class="example">è</span>i</td></tr>
                <tr><td>有 o</td><td>標在 o 上</td><td>g<span class="example">ǒ</span>u, du<span class="example">ō</span></td></tr>
                <tr><td>iu 組合</td><td>標在 u 上</td><td>li<span class="example">ú</span>, ji<span class="example">ǔ</span></td></tr>
                <tr><td>ui 組合</td><td>標在 i 上</td><td>gu<span class="example">ì</span>, hu<span class="example">í</span></td></tr>
            </table>
            <p><strong>實用提醒：</strong>使用拼音輸入法打字時不需要輸入聲調，直接打字母即可。聲調知識主要用於閱讀拼音和學習正確發音。</p>
        `,
        quiz: [
            { q: 'hao 的聲調標在哪個字母上？', options: ['a', 'o', 'h', '不標'], answer: 'a', explain: '有 a 就標 a' },
            { q: 'mei 的聲調標在哪個字母上？', options: ['m', 'e', 'i', '不標'], answer: 'e', explain: '有 e 就標 e' },
            { q: 'liu 的聲調標在哪個字母上？', options: ['l', 'i', 'u', '不標'], answer: 'u', explain: 'iu 組合標在後面的 u 上' },
            { q: 'gui 的聲調標在哪個字母上？', options: ['g', 'u', 'i', '不標'], answer: 'i', explain: 'ui 組合標在後面的 i 上' },
            { q: 'gou 的聲調標在哪個字母上？', options: ['g', 'o', 'u', '不標'], answer: 'o', explain: '有 o 就標 o' },
        ]
    },
    'confusion': {
        title: '易混淆組',
        content: `
            <h3>常見易混淆拼音組</h3>
            ${App.mappings ? App.mappings.confusion_pairs.map(p =>
                `<div style="margin:8px 0;padding:8px 12px;background:var(--bg-input);border-radius:6px">
                    <strong>${p.pair[0]} vs ${p.pair[1]}</strong><br>
                    <span style="color:var(--text-dim)">${p.hint}</span>
                </div>`
            ).join('') : '載入中...'}
        `,
        quiz: []
    }
};

function setupPhase2() {
    document.querySelectorAll('#view-phase2 .group-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#view-phase2 .group-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            App.phase2.rule = btn.dataset.rule;
            showRule(btn.dataset.rule);
        });
    });
    showRule('u-rule');
}

function showRule(ruleId) {
    const rule = RULES[ruleId];
    if (!rule) return;

    // Update confusion content dynamically
    if (ruleId === 'confusion' && App.mappings) {
        rule.content = `
            <h3>常見易混淆拼音組</h3>
            ${App.mappings.confusion_pairs.map(p =>
                `<div style="margin:8px 0;padding:8px 12px;background:var(--bg-input);border-radius:6px">
                    <strong>${p.pair[0]} vs ${p.pair[1]}</strong><br>
                    <span style="color:var(--text-dim)">${p.hint}</span>
                </div>`
            ).join('')}
        `;
    }

    document.getElementById('rule-content').innerHTML = rule.content +
        (rule.quiz.length > 0 ? `<button class="start-quiz-btn" onclick="startRuleQuiz('${ruleId}')">開始測驗</button>` : '');
    document.getElementById('rule-quiz').style.display = 'none';
}

function startRuleQuiz(ruleId) {
    const rule = RULES[ruleId];
    if (!rule || rule.quiz.length === 0) return;

    App.phase2.quizItems = shuffle(rule.quiz);
    App.phase2.current = 0;
    App.phase2.correct = 0;
    App.phase2.wrong = 0;

    document.getElementById('rule-content').style.display = 'none';
    document.getElementById('rule-quiz').style.display = '';
    showRuleQuizCard();
}

function showRuleQuizCard() {
    const p = App.phase2;
    if (p.current >= p.quizItems.length) {
        document.getElementById('rule-content').style.display = '';
        document.getElementById('rule-quiz').style.display = 'none';
        showRule(p.rule);
        return;
    }

    const item = p.quizItems[p.current];
    document.getElementById('rule-question').textContent = item.q;
    document.getElementById('rule-feedback').textContent = '';
    document.getElementById('rule-feedback').className = 'feedback';

    const pct = (p.current / p.quizItems.length * 100).toFixed(0);
    document.getElementById('rule-progress-bar').style.width = pct + '%';
    document.getElementById('rule-progress-text').textContent = `${p.current} / ${p.quizItems.length}`;

    const container = document.getElementById('rule-options');
    container.innerHTML = '';
    const options = shuffle(item.options);
    options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="key-hint">${i + 1}</span>${opt}`;
        btn.addEventListener('click', () => handleRuleAnswer(opt, item));
        container.appendChild(btn);
    });

    App._ruleHandler = (e) => {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < options.length) handleRuleAnswer(options[idx], item);
    };
    document.addEventListener('keydown', App._ruleHandler);
}

function handleRuleAnswer(chosen, item) {
    document.removeEventListener('keydown', App._ruleHandler);
    const isCorrect = chosen === item.answer;
    const p = App.phase2;

    document.querySelectorAll('#rule-options .option-btn').forEach(btn => {
        if (btn.textContent.includes(item.answer)) btn.classList.add('correct');
        else if (btn.textContent.includes(chosen) && !isCorrect) btn.classList.add('wrong');
        btn.style.pointerEvents = 'none';
    });

    if (isCorrect) {
        p.correct++;
        addXP(5); // Award XP for correct answer
        document.getElementById('rule-feedback').textContent = '正確！' + item.explain;
        document.getElementById('rule-feedback').className = 'feedback correct';
    } else {
        p.wrong++;
        document.getElementById('rule-feedback').textContent = `答案是 ${item.answer}。${item.explain}`;
        document.getElementById('rule-feedback').className = 'feedback wrong';
    }

    setTimeout(() => { p.current++; showRuleQuizCard(); }, isCorrect ? 800 : 2500);
}

// ============================================================
// Phase 3: Character Practice
// ============================================================
const COMMON_CHARS = '的一是不了人我在有他這中大來上個國到說們為子和你地出會也時要就可以對生能而都行使去作如還下家學多然自回所果成發見只間方長又公三已老從動兩機工之都天種面年什開它者裡兩等新心已點問情知道話力理爾其實全才好部水高沒小軍法當沒起與現長回你門事很比更名第將組外產此想手兒先被分無但信關進不入找前頭位後少數表美工相全力正新明年書看體幾定月題正平同業氣十學代已名打則才地者間世次被教張因邊門條寫運再問題次見法活星記品站資意世表';

function setupPhase3() {
    document.getElementById('char-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') handlePhase3Input();
    });
}

async function startPhase3() {
    // Use pypinyin on backend or generate from common chars
    const chars = shuffle(COMMON_CHARS.split('')).slice(0, 30);
    const items = [];
    for (const char of chars) {
        try {
            const resp = await API.get(`/api/character/${encodeURIComponent(char)}`);
            if (resp.pinyin) items.push({ character: char, pinyin: resp.pinyin });
        } catch {
            // Skip if endpoint not ready
        }
    }

    if (items.length === 0) {
        // Fallback: use mapping data for practice
        const allItems = [...App.mappings.initials, ...App.mappings.finals];
        App.phase3.items = shuffle(allItems).slice(0, 20).map(i => ({
            character: i.zhuyin,
            pinyin: i.pinyin
        }));
    } else {
        App.phase3.items = items;
    }

    App.phase3.current = 0;
    App.phase3.correct = 0;
    App.phase3.wrong = 0;
    App.phase3.startTime = Date.now();
    showPhase3Card();
}

function showPhase3Card() {
    const p = App.phase3;
    if (p.current >= p.items.length) {
        alert(`完成！正確 ${p.correct}/${p.correct + p.wrong}`);
        return;
    }

    const item = p.items[p.current];
    document.getElementById('card-character').textContent = item.character;
    document.getElementById('char-feedback').textContent = '';
    document.getElementById('char-feedback').className = 'feedback';

    const pct = (p.current / p.items.length * 100).toFixed(0);
    document.getElementById('char-progress-bar').style.width = pct + '%';
    document.getElementById('char-progress-text').textContent = `${p.current} / ${p.items.length}`;

    document.getElementById('char-stat-correct').textContent = `✓ ${p.correct}`;
    document.getElementById('char-stat-wrong').textContent = `✗ ${p.wrong}`;

    const inp = document.getElementById('char-input');
    inp.value = '';
    inp.className = 'pinyin-input';
    inp.focus();
}

function handlePhase3Input() {
    const inp = document.getElementById('char-input');
    const answer = inp.value.trim().toLowerCase();
    if (!answer) return;

    const p = App.phase3;
    const item = p.items[p.current];
    const isCorrect = answer === item.pinyin.toLowerCase().replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, m => {
        const map = {ā:'a',á:'a',ǎ:'a',à:'a',ē:'e',é:'e',ě:'e',è:'e',ī:'i',í:'i',ǐ:'i',ì:'i',ō:'o',ó:'o',ǒ:'o',ò:'o',ū:'u',ú:'u',ǔ:'u',ù:'u',ǖ:'v',ǘ:'v',ǚ:'v',ǜ:'v'};
        return map[m] || m;
    });

    if (isCorrect) {
        p.correct++;
        addXP(5); // Award XP for correct answer
        document.getElementById('char-feedback').textContent = '正確！';
        document.getElementById('char-feedback').className = 'feedback correct';
    } else {
        p.wrong++;
        document.getElementById('char-feedback').textContent = `正確答案：${item.pinyin}`;
        document.getElementById('char-feedback').className = 'feedback wrong';
    }

    submitReview(item.character, 'character', isCorrect);
    setTimeout(() => { p.current++; showPhase3Card(); }, isCorrect ? 500 : 1500);
}

// ============================================================
// Phase 4: Word Practice
// ============================================================
const COMMON_WORDS = [
    { word: '你好', pinyin: 'ni hao' }, { word: '謝謝', pinyin: 'xie xie' },
    { word: '不是', pinyin: 'bu shi' }, { word: '可以', pinyin: 'ke yi' },
    { word: '什麼', pinyin: 'shen me' }, { word: '知道', pinyin: 'zhi dao' },
    { word: '時候', pinyin: 'shi hou' }, { word: '現在', pinyin: 'xian zai' },
    { word: '怎麼', pinyin: 'zen me' }, { word: '已經', pinyin: 'yi jing' },
    { word: '因為', pinyin: 'yin wei' }, { word: '所以', pinyin: 'suo yi' },
    { word: '如果', pinyin: 'ru guo' }, { word: '但是', pinyin: 'dan shi' },
    { word: '還是', pinyin: 'hai shi' }, { word: '或者', pinyin: 'huo zhe' },
    { word: '一起', pinyin: 'yi qi' }, { word: '覺得', pinyin: 'jue de' },
    { word: '應該', pinyin: 'ying gai' }, { word: '然後', pinyin: 'ran hou' },
    { word: '非常', pinyin: 'fei chang' }, { word: '可能', pinyin: 'ke neng' },
    { word: '需要', pinyin: 'xu yao' }, { word: '開始', pinyin: 'kai shi' },
    { word: '問題', pinyin: 'wen ti' }, { word: '學習', pinyin: 'xue xi' },
    { word: '工作', pinyin: 'gong zuo' }, { word: '生活', pinyin: 'sheng huo' },
    { word: '朋友', pinyin: 'peng you' }, { word: '電話', pinyin: 'dian hua' },
    { word: '公司', pinyin: 'gong si' }, { word: '學校', pinyin: 'xue xiao' },
    { word: '老師', pinyin: 'lao shi' }, { word: '同學', pinyin: 'tong xue' },
    { word: '喜歡', pinyin: 'xi huan' }, { word: '漂亮', pinyin: 'piao liang' },
    { word: '認為', pinyin: 'ren wei' }, { word: '準備', pinyin: 'zhun bei' },
    { word: '影響', pinyin: 'ying xiang' }, { word: '重要', pinyin: 'zhong yao' },
    { word: '發現', pinyin: 'fa xian' }, { word: '環境', pinyin: 'huan jing' },
    { word: '經濟', pinyin: 'jing ji' }, { word: '社會', pinyin: 'she hui' },
    { word: '政府', pinyin: 'zheng fu' }, { word: '國家', pinyin: 'guo jia' },
    { word: '世界', pinyin: 'shi jie' }, { word: '歷史', pinyin: 'li shi' },
    { word: '文化', pinyin: 'wen hua' }, { word: '科技', pinyin: 'ke ji' },
    { word: '健康', pinyin: 'jian kang' }, { word: '教育', pinyin: 'jiao yu' },
    { word: '自己', pinyin: 'zi ji' }, { word: '大家', pinyin: 'da jia' },
    { word: '一樣', pinyin: 'yi yang' }, { word: '地方', pinyin: 'di fang' },
    { word: '東西', pinyin: 'dong xi' }, { word: '多少', pinyin: 'duo shao' },
    { word: '這樣', pinyin: 'zhe yang' }, { word: '那個', pinyin: 'na ge' },
    { word: '電腦', pinyin: 'dian nao' }, { word: '網路', pinyin: 'wang lu' },
    { word: '手機', pinyin: 'shou ji' }, { word: '音樂', pinyin: 'yin yue' },
    { word: '運動', pinyin: 'yun dong' }, { word: '旅行', pinyin: 'lv xing' },
    { word: '飛機', pinyin: 'fei ji' }, { word: '醫院', pinyin: 'yi yuan' },
    { word: '銀行', pinyin: 'yin hang' }, { word: '超市', pinyin: 'chao shi' },
    { word: '早上', pinyin: 'zao shang' }, { word: '晚上', pinyin: 'wan shang' },
    { word: '下午', pinyin: 'xia wu' }, { word: '明天', pinyin: 'ming tian' },
    { word: '昨天', pinyin: 'zuo tian' }, { word: '今天', pinyin: 'jin tian' },
    { word: '星期', pinyin: 'xing qi' }, { word: '月亮', pinyin: 'yue liang' },
    { word: '太陽', pinyin: 'tai yang' }, { word: '天氣', pinyin: 'tian qi' },
    { word: '吃飯', pinyin: 'chi fan' }, { word: '睡覺', pinyin: 'shui jiao' },
    { word: '說話', pinyin: 'shuo hua' }, { word: '走路', pinyin: 'zou lu' },
    { word: '開車', pinyin: 'kai che' }, { word: '游泳', pinyin: 'you yong' },
    { word: '唱歌', pinyin: 'chang ge' }, { word: '跳舞', pinyin: 'tiao wu' },
    { word: '看書', pinyin: 'kan shu' }, { word: '寫字', pinyin: 'xie zi' },
    { word: '考試', pinyin: 'kao shi' }, { word: '上班', pinyin: 'shang ban' },
    { word: '下班', pinyin: 'xia ban' }, { word: '回家', pinyin: 'hui jia' },
    { word: '出門', pinyin: 'chu men' }, { word: '進來', pinyin: 'jin lai' },
    { word: '出去', pinyin: 'chu qu' }, { word: '上去', pinyin: 'shang qu' },
    { word: '下來', pinyin: 'xia lai' }, { word: '過來', pinyin: 'guo lai' },
    { word: '起來', pinyin: 'qi lai' }, { word: '回去', pinyin: 'hui qu' },
    { word: '容易', pinyin: 'rong yi' }, { word: '困難', pinyin: 'kun nan' },
    { word: '簡單', pinyin: 'jian dan' }, { word: '複雜', pinyin: 'fu za' },
    { word: '快樂', pinyin: 'kuai le' }, { word: '幸福', pinyin: 'xing fu' },
    { word: '安全', pinyin: 'an quan' }, { word: '危險', pinyin: 'wei xian' },
];

function setupPhase4() {
    document.getElementById('word-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') handlePhase4Input();
    });
}

function startPhase4() {
    App.phase4.items = shuffle(COMMON_WORDS).slice(0, 20);
    App.phase4.current = 0;
    App.phase4.correct = 0;
    App.phase4.wrong = 0;
    showPhase4Card();
}

function showPhase4Card() {
    const p = App.phase4;
    if (p.current >= p.items.length) {
        alert(`完成！正確 ${p.correct}/${p.correct + p.wrong}`);
        startPhase4();
        return;
    }

    const item = p.items[p.current];
    document.getElementById('card-word').textContent = item.word;
    document.getElementById('word-feedback').textContent = '';
    document.getElementById('word-feedback').className = 'feedback';

    const pct = (p.current / p.items.length * 100).toFixed(0);
    document.getElementById('word-progress-bar').style.width = pct + '%';
    document.getElementById('word-progress-text').textContent = `${p.current} / ${p.items.length}`;
    document.getElementById('word-stat-correct').textContent = `✓ ${p.correct}`;
    document.getElementById('word-stat-wrong').textContent = `✗ ${p.wrong}`;

    const inp = document.getElementById('word-input');
    inp.value = '';
    inp.className = 'pinyin-input';
    inp.focus();
}

function handlePhase4Input() {
    const inp = document.getElementById('word-input');
    const answer = inp.value.trim().toLowerCase();
    if (!answer) return;

    const p = App.phase4;
    const item = p.items[p.current];
    const isCorrect = answer === item.pinyin.toLowerCase();

    if (isCorrect) {
        p.correct++;
        addXP(5); // Award XP for correct answer
        document.getElementById('word-feedback').textContent = '正確！';
        document.getElementById('word-feedback').className = 'feedback correct';
    } else {
        p.wrong++;
        document.getElementById('word-feedback').textContent = `正確答案：${item.pinyin}`;
        document.getElementById('word-feedback').className = 'feedback wrong';
    }

    setTimeout(() => { p.current++; showPhase4Card(); }, isCorrect ? 500 : 1500);
}

// ============================================================
// Phase 5: Speed Training
// ============================================================
function setupPhase5() {
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => startSpeedTest(parseInt(btn.dataset.duration)));
    });

    document.getElementById('speed-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleSpeedInput();
    });

    document.getElementById('speed-restart').addEventListener('click', () => {
        document.getElementById('speed-result').style.display = 'none';
        document.getElementById('speed-setup').style.display = '';
    });
}

function startSpeedTest(duration) {
    const allItems = [...App.mappings.initials, ...App.mappings.finals];
    App.phase5.items = shuffle(allItems);
    App.phase5.duration = duration;
    App.phase5.timeLeft = duration;
    App.phase5.total = 0;
    App.phase5.correct = 0;
    App.phase5.current = 0;

    document.getElementById('speed-setup').style.display = 'none';
    document.getElementById('speed-game').style.display = '';
    document.getElementById('speed-result').style.display = 'none';

    showSpeedCard();

    App.phase5.timer = setInterval(() => {
        App.phase5.timeLeft--;
        document.getElementById('speed-timer').textContent = App.phase5.timeLeft;

        if (App.phase5.timeLeft <= 0) {
            clearInterval(App.phase5.timer);
            endSpeedTest();
        }
    }, 1000);

    document.getElementById('speed-input').focus();
}

function showSpeedCard() {
    const p = App.phase5;
    if (p.current >= p.items.length) {
        p.items = shuffle([...App.mappings.initials, ...App.mappings.finals]);
        p.current = 0;
    }

    const item = p.items[p.current];
    document.getElementById('speed-zhuyin').textContent = item.zhuyin;

    const inp = document.getElementById('speed-input');
    inp.value = '';
    inp.focus();

    // Update stats
    const elapsed = App.phase5.duration - App.phase5.timeLeft;
    const wpm = elapsed > 0 ? Math.round(App.phase5.correct / elapsed * 60) : 0;
    const accuracy = App.phase5.total > 0 ? Math.round(App.phase5.correct / App.phase5.total * 100) : 100;
    document.getElementById('speed-wpm').textContent = `${wpm} 字/分`;
    document.getElementById('speed-accuracy').textContent = `${accuracy}%`;
}

function handleSpeedInput() {
    const inp = document.getElementById('speed-input');
    const answer = inp.value.trim().toLowerCase();
    if (!answer) return;

    const p = App.phase5;
    const item = p.items[p.current];
    p.total++;

    if (answer === item.pinyin.toLowerCase()) {
        p.correct++;
        addXP(5); // Award XP for correct answer in speed mode
    }

    p.current++;
    showSpeedCard();
}

function endSpeedTest() {
    const p = App.phase5;
    const wpm = Math.round(p.correct / p.duration * 60);
    const accuracy = p.total > 0 ? Math.round(p.correct / p.total * 100) : 0;

    document.getElementById('speed-game').style.display = 'none';
    document.getElementById('speed-result').style.display = '';

    document.getElementById('speed-result-wpm').textContent = wpm;
    document.getElementById('speed-result-accuracy').textContent = accuracy + '%';
    document.getElementById('speed-result-total').textContent = p.total;

    API.post('/api/session', {
        phase: 5, mode: 'speed', duration: p.duration,
        total: p.total, correct: p.correct
    });
}

// ============================================================
// Dashboard
// ============================================================
async function loadDashboard() {
    const data = await API.get('/api/progress');
    const progressItems = data.items;
    const sessions = data.sessions;

    // Overall stats
    const totalItems = App.mappings.initials.length + App.mappings.finals.length;
    const masteredItems = progressItems.filter(i => i.repetitions >= 3).length;
    document.getElementById('dash-overall').innerHTML =
        `<p>已學習項目：${progressItems.length} / ${totalItems}</p>
         <p>已熟練項目：${masteredItems} / ${totalItems}</p>
         <p>總練習次數：${sessions.length}</p>`;

    // Initials mastery grid
    renderMasteryGrid('dash-initials', App.mappings.initials, progressItems);

    // Finals mastery grid
    renderMasteryGrid('dash-finals', App.mappings.finals, progressItems);

    // Weakness items
    const weakItems = progressItems
        .filter(i => i.wrong_count > 0)
        .sort((a, b) => b.wrong_count - a.wrong_count)
        .slice(0, 10);

    document.getElementById('dash-weakness').innerHTML = weakItems.length > 0 ?
        weakItems.map(w => `<div class="weakness-item">
            <span>${w.item_id} (${w.item_type})</span>
            <span style="color:var(--wrong)">錯 ${w.wrong_count} 次 / 對 ${w.correct_count} 次</span>
        </div>`).join('') : '<p style="color:var(--text-dim)">目前沒有弱點項目</p>';

    // Sessions
    document.getElementById('dash-sessions').innerHTML = sessions.length > 0 ?
        sessions.slice(0, 10).map(s => {
            const date = new Date(s.created_at * 1000).toLocaleDateString('zh-TW');
            const accuracy = s.total > 0 ? Math.round(s.correct / s.total * 100) : 0;
            return `<div class="session-row">
                <span>${date}</span>
                <span>Phase ${s.phase} · ${s.mode}</span>
                <span>${s.correct}/${s.total} (${accuracy}%)</span>
                <span>${s.duration}s</span>
            </div>`;
        }).join('') : '<p style="color:var(--text-dim)">尚無練習紀錄</p>';
}

function renderMasteryGrid(containerId, items, progressItems) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(item => {
        const prog = progressItems.find(p => p.item_id === item.pinyin && p.item_type === (items === App.mappings.initials ? 'initial' : 'final'));
        let level = 0;
        if (prog) {
            if (prog.repetitions >= 5) level = 4;
            else if (prog.repetitions >= 3) level = 3;
            else if (prog.repetitions >= 1) level = 2;
            else if (prog.wrong_count > 0) level = 1;
        }
        return `<div class="mastery-cell mastery-${level}">
            <span class="zhuyin">${item.zhuyin}</span>
            <span class="pinyin">${item.pinyin}</span>
        </div>`;
    }).join('');
}

// ============================================================
// Boot
// ============================================================
document.addEventListener('DOMContentLoaded', init);
