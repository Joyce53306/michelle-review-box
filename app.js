// ===== Michelle's Review Box · app.js =====

// ── 狀態 ──
let curSubject = 'zh';
let curGrade   = 'g7';
let curSection = null;
let curMode    = 'quiz';
let curQtype   = 'mix';
let curExStyle = 'story';
let chartInst  = null;
let records    = JSON.parse(localStorage.getItem('mrb_records') || '[]');
let counts     = JSON.parse(localStorage.getItem('mrb_counts')  || '{"zh":0,"en":0,"ss":0,"math":0,"sci":0}');

// ── 初始化 ──
(function init() {
  buildSubjectTabs();
  buildQtypeGrid();
  buildExplainGrid();
  refreshGrade();
  renderRecords();
})();

// ── 建立科目 Tabs ──
function buildSubjectTabs() {
  const wrap = document.getElementById('subjectTabs');
  wrap.innerHTML = Object.entries(CURRICULUM).map(([key, sub]) =>
    `<button class="sub-tab ${key === curSubject ? 'active' : ''}"
      id="sub-${key}" onclick="setSubject('${key}')"
      style="${key === curSubject ? `background:${sub.bg};border-color:${sub.border};color:${sub.text}` : ''}">
      ${sub.emoji} ${sub.label}
    </button>`
  ).join('');
}

// ── 科目切換 ──
function setSubject(s) {
  curSubject = s;
  curSection = null;
  Object.entries(CURRICULUM).forEach(([key, sub]) => {
    const btn = document.getElementById('sub-' + key);
    if (key === s) {
      btn.className = 'sub-tab active';
      btn.style.cssText = `background:${sub.bg};border-color:${sub.border};color:${sub.text}`;
    } else {
      btn.className = 'sub-tab';
      btn.style.cssText = '';
    }
  });
  document.getElementById('goBtn').style.background = CURRICULUM[s].color;
  refreshGrade();
}

// ── 年級切換 ──
function setGrade(g) {
  curGrade = g;
  curSection = null;
  ['g7','g8','g9'].forEach(x => {
    document.getElementById('g-' + x).className = 'g-tab' + (x === g ? ' active' : '');
  });
  refreshGrade();
}

// ── 重繪單元 + 主題 ──
function refreshGrade() {
  const gradeData = CURRICULUM[curSubject].grades[curGrade];
  const sections  = gradeData.sections;
  const keys      = Object.keys(sections);

  // 預設選第一個單元
  if (!curSection || !sections[curSection]) curSection = keys[0];

  // 單元 chips
  const sa = document.getElementById('sectionArea');
  const sub = CURRICULUM[curSubject];
  sa.innerHTML = keys.map(k =>
    `<button class="sec-chip ${k === curSection ? 'active' : ''}"
      id="sec-${k.replace(/\s/g,'_')}"
      onclick="setSection('${k}')"
      style="${k === curSection ? `background:${sub.color};border-color:${sub.color}` : ''}">
      ${k}
    </button>`
  ).join('');

  refreshTopics();
}

// ── 單元切換 ──
function setSection(s) {
  const sub = CURRICULUM[curSubject];
  const gradeData = CURRICULUM[curSubject].grades[curGrade];
  const keys = Object.keys(gradeData.sections);

  // 取消前一個
  keys.forEach(k => {
    const btn = document.getElementById('sec-' + k.replace(/\s/g,'_'));
    if (btn) { btn.className = 'sec-chip'; btn.style.cssText = ''; }
  });
  curSection = s;
  const active = document.getElementById('sec-' + s.replace(/\s/g,'_'));
  if (active) {
    active.className = 'sec-chip active';
    active.style.cssText = `background:${sub.color};border-color:${sub.color}`;
  }
  refreshTopics();
}

// ── 更新主題下拉 ──
function refreshTopics() {
  const topics = CURRICULUM[curSubject].grades[curGrade].sections[curSection] || [];
  const sel = document.getElementById('topicSelect');
  sel.innerHTML = topics.map(t => `<option>${t}</option>`).join('');
}

// ── 模式切換 ──
function setMode(m) {
  curMode = m;
  ['quiz','explain','grade'].forEach(x => {
    document.getElementById('mode-' + x).className = 'mode-btn' + (x === m ? ' active' : '');
  });
  document.getElementById('qtypeSection').style.display   = m === 'quiz'    ? 'block' : 'none';
  document.getElementById('explainSection').style.display = m === 'explain' ? 'block' : 'none';

  const hints = {
    quiz:    '選好題型後按「開始練習」，AI 老師出題，作答後貼回來批改',
    explain: '選好解釋風格後按「開始練習」，AI 老師用不同方式解說',
    grade:   '把你的作答貼到下方輸入框，AI 老師幫你批改並說明哪裡錯了'
  };
  document.getElementById('inputHint').textContent = hints[m];
  document.getElementById('userInput').placeholder =
    m === 'grade' ? '請在這裡貼上你的作答內容...' : '（可選填）補充說明或指定難度';
}

// ── 建立題型 Chips ──
function buildQtypeGrid() {
  document.getElementById('qtypeGrid').innerHTML = QTYPES.map((q, i) =>
    `<button class="chip ${i === 0 ? 'active' : ''}" id="qt-${q.id}" onclick="setQtype('${q.id}')">${q.label}</button>`
  ).join('');
}

function setQtype(q) {
  curQtype = q;
  QTYPES.forEach(x => {
    document.getElementById('qt-' + x.id).className = 'chip' + (x.id === q ? ' active' : '');
  });
}

// ── 建立解釋風格 Chips ──
function buildExplainGrid() {
  document.getElementById('explainGrid').innerHTML = EXPLAIN_STYLES.map((s, i) =>
    `<button class="chip ${i === 0 ? 'active' : ''}" id="es-${s.id}" onclick="setExStyle('${s.id}')">${s.label}</button>`
  ).join('');
}

function setExStyle(s) {
  curExStyle = s;
  EXPLAIN_STYLES.forEach(x => {
    document.getElementById('es-' + x.id).className = 'chip' + (x.id === s ? ' active' : '');
  });
}

// ── 清除畫面 ──
function clearOutput() {
  document.getElementById('userInput').value = '';
  const box = document.getElementById('responseBox');
  box.className = 'response-box'; box.textContent = '';
  document.getElementById('chartWrap').className = 'chart-wrap';
  if (chartInst) { chartInst.destroy(); chartInst = null; }
}

// ── 紀錄面板開關 ──
function toggleRecord() {
  document.getElementById('recordPanel').classList.toggle('open');
}

// ── 新增紀錄 ──
function addRecord(sub, grade, section, topic, mode, qtype) {
  counts[sub] = (counts[sub] || 0) + 1;
  const ml = { quiz:'出題', explain:'解釋', grade:'批改' }[mode];
  const ql = QTYPES.find(q => q.id === qtype)?.label || '';
  const time = new Date().toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  records.unshift({ sub, grade, section, topic, ml, ql, time });
  if (records.length > 40) records.pop();
  localStorage.setItem('mrb_records', JSON.stringify(records));
  localStorage.setItem('mrb_counts',  JSON.stringify(counts));
  renderRecords();
}

// ── 渲染紀錄 ──
function renderRecords() {
  const total = Object.values(counts).reduce((a,b) => a+b, 0);
  document.getElementById('statBadge').textContent = total;
  document.getElementById('sTotal').textContent = total;
  document.getElementById('sZh').textContent   = counts.zh   || 0;
  document.getElementById('sEn').textContent   = counts.en   || 0;
  document.getElementById('sSs').textContent   = counts.ss   || 0;
  document.getElementById('sMath').textContent = counts.math || 0;
  document.getElementById('sSci').textContent  = counts.sci  || 0;

  const sub = CURRICULUM;
  const list = document.getElementById('recList');
  if (!records.length) { list.innerHTML = '<p class="rec-empty">還沒有記錄，快開始練習吧！</p>'; return; }
  list.innerHTML = records.slice(0,12).map(r => {
    const s = sub[r.sub];
    return `<div class="rec-item">
      <span class="rec-badge" style="background:${s.bg};color:${s.text}">${s.label}</span>
      ${r.grade === 'g7' ? '七年級' : r.grade === 'g8' ? '八年級' : '九年級'}・${r.section}・${r.topic}
      　${r.ml}${r.ql ? '／' + r.ql.replace(/\S+\s/,'') : ''}
      <span style="float:right;color:#ccc;font-size:11px">${r.time}</span>
    </div>`;
  }).join('');
}

// ── 清除紀錄 ──
function clearRecords() {
  if (!confirm('確定要清除所有學習紀錄嗎？')) return;
  records = []; counts = { zh:0, en:0, ss:0, math:0, sci:0 };
  localStorage.setItem('mrb_records', '[]');
  localStorage.setItem('mrb_counts',  JSON.stringify(counts));
  renderRecords();
}

// ── 嘗試渲染圖表 ──
function tryChart(text) {
  const m = text.match(/JSON_CHART\s*(\{[\s\S]*?\})/);
  if (!m) return text;
  try {
    const cfg = JSON.parse(m[1]);
    document.getElementById('chartWrap').className = 'chart-wrap show';
    if (chartInst) chartInst.destroy();
    chartInst = new Chart(
      document.getElementById('myChart').getContext('2d'), {
        type: cfg.type || 'bar',
        data: cfg.data,
        options: {
          responsive: true,
          plugins: {
            legend: { position:'bottom' },
            title:  { display: !!cfg.title, text: cfg.title || '' }
          },
          scales: ['pie','doughnut'].includes(cfg.type) ? {} : { y:{ beginAtZero:true } }
        }
      }
    );
    return text.replace(/JSON_CHART\s*\{[\s\S]*?\}/, '\n📊 圖表已顯示於上方\n');
  } catch(e) {
    return text.replace(/JSON_CHART[\s\S]*/, '');
  }
}

// ── 主程式：呼叫 Claude API ──
async function startAI() {
  const topic    = document.getElementById('topicSelect').value;
  const userText = document.getElementById('userInput').value.trim();
  const sub      = CURRICULUM[curSubject];
  const gradeLabel = sub.grades[curGrade].label;
  const box      = document.getElementById('responseBox');

  // 系統提示
  const system = `你是一位親切專業的${sub.label}老師，學生叫 Michelle，目前${gradeLabel}（英文程度已達國三上）。請全程用繁體中文，語氣溫暖鼓勵、條理清晰，適合國中生理解。`;

  // 使用者提示
  let prompt = '';
  if (curMode === 'quiz') {
    const needChart = curQtype === 'chart';
    prompt = `請針對「${gradeLabel}・${curSection}」的主題「${topic}」出題。
要求：${QTYPE_PROMPTS[curQtype]}。
出完後等 Michelle 作答，不要直接給答案。
${needChart ? '圖表格式：' + CHART_FMT : ''}
${userText ? '補充需求：' + userText : ''}`;
  } else if (curMode === 'explain') {
    const needChart = curExStyle === 'visual';
    prompt = `請解釋「${gradeLabel}・${curSection}」中的「${topic}」觀念。
解釋方式：${EXPLAIN_PROMPTS[curExStyle]}。
${needChart ? '圖表格式：' + CHART_FMT : ''}
${userText ? 'Michelle 補充：' + userText : ''}`;
  } else {
    if (!userText) {
      box.className = 'response-box show';
      box.textContent = '請先在上方輸入框貼上你的作答，AI 老師才能幫你批改喔！';
      return;
    }
    prompt = `Michelle 針對「${gradeLabel}・${topic}」的作答如下，請鼓勵性批改：
① 先肯定優點 ② 指出錯誤並說明原因 ③ 給出正確觀念 ④ 建議改進方向
最後給 1–10 分並說明理由。

Michelle 的作答：
${userText}`;
  }

  // 顯示載入
  box.className = 'response-box show';
  box.innerHTML = '<span class="loading-dots">✨ AI 老師思考中，請稍候…</span>';
  document.getElementById('chartWrap').className = 'chart-wrap';
  if (chartInst) { chartInst.destroy(); chartInst = null; }
  document.getElementById('goBtn').disabled = true;

  addRecord(curSubject, curGrade, curSection, topic, curMode, curQtype);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1200,
        system,
        messages: [{ role:'user', content: prompt }]
      })
    });
    const data = await res.json();
    let text = data.content?.map(c => c.text || '').join('') || '抱歉發生問題，請再試一次。';
    text = tryChart(text);
    box.textContent = text;
  } catch(e) {
    box.textContent = '連線發生問題，請稍後再試，或重新整理頁面。';
  }
  document.getElementById('goBtn').disabled = false;
}
