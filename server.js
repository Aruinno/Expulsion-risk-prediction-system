const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3000;
const DB   = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── DB helpers ───────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB)) {
    const seed = {
      disciplines: [
        { id: 'd1', name: 'Математика',       lessons: 36, tasks: 8  },
        { id: 'd2', name: 'Программирование', lessons: 30, tasks: 12 },
        { id: 'd3', name: 'Базы данных',      lessons: 24, tasks: 6  },
        { id: 'd4', name: 'Английский язык',  lessons: 20, tasks: 5  },
      ],
      students: [
        { id:'STU-001', name:'Алия Нурланова',   group:'ИС-21-1', semester:'3', gpa:3.8,
          discData:{ d1:{attended:34,done:8}, d2:{attended:28,done:12}, d3:{attended:22,done:6}, d4:{attended:19,done:5} } },
        { id:'STU-002', name:'Тимур Бекович',    group:'ИС-21-1', semester:'3', gpa:2.1,
          discData:{ d1:{attended:14,done:2}, d2:{attended:10,done:3}, d3:{attended:8,done:1},  d4:{attended:7,done:1}  } },
        { id:'STU-003', name:'Дана Сейткали',    group:'ИС-21-2', semester:'3', gpa:2.9,
          discData:{ d1:{attended:20,done:4}, d2:{attended:17,done:6}, d3:{attended:15,done:3}, d4:{attended:12,done:3} } },
        { id:'STU-004', name:'Руслан Ахметов',   group:'ВТ-22-1', semester:'2', gpa:3.5,
          discData:{ d1:{attended:32,done:7}, d2:{attended:27,done:11},d3:{attended:21,done:5}, d4:{attended:18,done:5} } },
        { id:'STU-005', name:'Айгерим Жакупова', group:'ВТ-22-1', semester:'2', gpa:1.8,
          discData:{ d1:{attended:12,done:2}, d2:{attended:9,done:2},  d3:{attended:7,done:1},  d4:{attended:5,done:0}  } },
      ]
    };
    fs.writeFileSync(DB, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DB, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// ─── DISCIPLINES ──────────────────────────────────────────────
app.get('/api/disciplines', (req, res) => {
  const { disciplines } = readDB();
  res.json(disciplines);
});

app.post('/api/disciplines', (req, res) => {
  const { name, lessons, tasks } = req.body;
  if (!name || !lessons) return res.status(400).json({ error: 'name and lessons required' });
  const db = readDB();
  const disc = { id: 'd' + Date.now(), name, lessons: +lessons, tasks: +(tasks || 0) };
  db.disciplines.push(disc);
  writeDB(db);
  res.status(201).json(disc);
});

app.delete('/api/disciplines/:id', (req, res) => {
  const db = readDB();
  const before = db.disciplines.length;
  db.disciplines = db.disciplines.filter(d => d.id !== req.params.id);
  if (db.disciplines.length === before) return res.status(404).json({ error: 'not found' });
  writeDB(db);
  res.json({ ok: true });
});

// ─── STUDENTS ─────────────────────────────────────────────────
app.get('/api/students', (req, res) => {
  const db = readDB();
  const { q } = req.query;
  let list = db.students;
  if (q) list = list.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.get('/api/students/:id', (req, res) => {
  const db = readDB();
  const s = db.students.find(s => s.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'not found' });
  res.json(s);
});

app.post('/api/students', (req, res) => {
  const { name, group, semester, gpa, discData } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const db = readDB();
  const id = req.body.id || 'STU-' + Date.now();
  if (db.students.find(s => s.id === id)) return res.status(409).json({ error: 'id already exists' });
  const student = { id, name, group: group || 'Без группы', semester: semester || '1', gpa: +(gpa || 0), discData: discData || {} };
  db.students.push(student);
  writeDB(db);
  res.status(201).json(student);
});

app.put('/api/students/:id', (req, res) => {
  const db = readDB();
  const idx = db.students.findIndex(s => s.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  db.students[idx] = { ...db.students[idx], ...req.body, id: req.params.id };
  writeDB(db);
  res.json(db.students[idx]);
});

app.delete('/api/students/:id', (req, res) => {
  const db = readDB();
  const before = db.students.length;
  db.students = db.students.filter(s => s.id !== req.params.id);
  if (db.students.length === before) return res.status(404).json({ error: 'not found' });
  writeDB(db);
  res.json({ ok: true });
});

// ─── STATS ────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const db = readDB();
  // Simple risk computation server-side
  function computeRisk(s, disciplines) {
    const discResults = disciplines.map(d => {
      const dd = (s.discData || {})[d.id] || { attended: 0, done: 0 };
      const attendPct = d.lessons > 0 ? dd.attended / d.lessons * 100 : 100;
      const taskPct   = d.tasks   > 0 ? dd.done     / d.tasks   * 100 : 100;
      return {
        attendFail: attendPct < 50,
        taskFail:   d.tasks > 0 && taskPct < 50,
        attendPct:  Math.round(attendPct),
        taskPct:    d.tasks > 0 ? Math.round(taskPct) : null,
      };
    });
    const forceHigh = discResults.some(r => r.attendFail || r.taskFail);
    const avgAttend = discResults.length ? discResults.reduce((a,r) => a + r.attendPct, 0) / discResults.length : 80;
    const taskDiscs = discResults.filter(r => r.taskPct !== null);
    const avgTask   = taskDiscs.length ? taskDiscs.reduce((a,r) => a + r.taskPct, 0) / taskDiscs.length : 80;
    const gpa       = parseFloat(s.gpa) || 2;
    const gpaScore  = (4 - gpa) / 4 * 100;
    let score = Math.round(Math.min(gpaScore * 0.30 + (100 - avgAttend) * 0.40 + (100 - avgTask) * 0.30, 100));
    let level;
    if (forceHigh || score >= 60) level = 'high';
    else if (score >= 35)          level = 'med';
    else                            level = 'low';
    return { pct: score, level };
  }
  const risks = db.students.map(s => computeRisk(s, db.disciplines).level);
  res.json({
    total: db.students.length,
    low:   risks.filter(r => r === 'low').length,
    med:   risks.filter(r => r === 'med').length,
    high:  risks.filter(r => r === 'high').length,
  });
});

app.listen(PORT, () => console.log(`RiskRadar backend running on http://localhost:${PORT}`));
