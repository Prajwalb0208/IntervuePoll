const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// In-memory state
const participants = new Map(); 
const kickedIds = new Set();
let currentQuestion = null; 
const history = []; 

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN === '' ? '*' : [FRONTEND_ORIGIN, /.*/], credentials: false }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN === '' ? '*' : [FRONTEND_ORIGIN, /.*/], methods: ['GET','POST'] }
});

function computeResults(question) {
  const counts = Array(question.options.length).fill(0);
  const total = question.answers.size || 0;
  for (const idx of question.answers.values()) counts[idx]++;
  const pct = counts.map(c => total === 0 ? 0 : Math.round((c * 100) / total));
  return { counts, total, percentages: pct };
}

function closeQuestionAndEmit() {
  if (!currentQuestion || currentQuestion.closed) return;
  currentQuestion.closed = true;
  const r = computeResults(currentQuestion);
  const payload = { id: currentQuestion.id, text: currentQuestion.text, options: currentQuestion.options, correctIndex: currentQuestion.correctIndex, results: r, askedAt: currentQuestion.startedAt };
  history.push(payload);
  io.emit('question_closed', payload);
}

io.on('connection', (socket) => {
  if (kickedIds.has(socket.handshake.auth?.userId)) {
    socket.emit('kicked');
    socket.disconnect(true);
    return;
  }

  socket.emit('connected', { socketId: socket.id });

  socket.on('register', ({ name, role }) => {
    const id = socket.handshake.auth?.userId || nanoid(8);
    const safeName = String(name || 'Anonymous').trim().slice(0, 50);
    const safeRole = role === 'teacher' ? 'teacher' : 'student';

    participants.set(socket.id, { id, name: safeName, role: safeRole });
    socket.data.userId = id;
    socket.data.role = safeRole;

    io.emit('participants', Array.from(participants.values()).map(p => ({ id: p.id, name: p.name, role: p.role })));

    if (currentQuestion) {
      const { id: qid, text, options, correctIndex, deadlineTs, startedAt, closed } = currentQuestion;
      socket.emit('question_state', { id: qid, text, options, correctIndex, deadlineTs, startedAt, closed: !!closed });
    }
  });

  socket.on('ask_question', ({ text, options, correctIndex = null, durationSec = 60 }) => {
    if (socket.data.role !== 'teacher') return;
    const now = Date.now();
    const allAnswered = () => {
      const activeStudentIds = Array.from(participants.values()).filter(p => p.role === 'student').map(p => p.id);
      return activeStudentIds.length > 0 && currentQuestion && currentQuestion.answers && activeStudentIds.every(uid => currentQuestion.answers.has(uid));
    };
    if (currentQuestion && !currentQuestion.closed && !allAnswered()) {
      socket.emit('error_msg', { message: 'Cannot ask a new question yet.' });
      return;
    }
    const qid = nanoid(6);
    currentQuestion = {
      id: qid,
      text: String(text || '').slice(0, 200),
      options: (options || []).map(o => String(o).slice(0, 100)).slice(0, 6),
      correctIndex: Number.isInteger(correctIndex) ? correctIndex : null,
      deadlineTs: now + Math.max(5, Math.min(600, Number(durationSec) || 60)) * 1000,
      answers: new Map(),
      startedAt: now,
      closed: false
    };
    io.emit('question_started', { id: currentQuestion.id, text: currentQuestion.text, options: currentQuestion.options, correctIndex: currentQuestion.correctIndex, deadlineTs: currentQuestion.deadlineTs, startedAt: currentQuestion.startedAt });

    const delay = currentQuestion.deadlineTs - Date.now();
    setTimeout(() => closeQuestionAndEmit(), Math.max(0, delay));
  });

  socket.on('end_question', () => {
    if (socket.data.role !== 'teacher') return;
    closeQuestionAndEmit();
  });

  socket.on('submit_answer', ({ optionIndex }) => {
    if (!currentQuestion || currentQuestion.closed) return;
    const uid = socket.data.userId;
    if (!uid) return;
    const now = Date.now();
    if (now > currentQuestion.deadlineTs) return;
    const idx = Number(optionIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= currentQuestion.options.length) return;
    if (!currentQuestion.answers.has(uid)) {
      currentQuestion.answers.set(uid, idx);
      io.emit('answer_count', { answered: currentQuestion.answers.size });
      // If all students answered early, close and emit
      const activeStudents = Array.from(participants.values()).filter(p => p.role === 'student').length;
      if (activeStudents > 0 && currentQuestion.answers.size >= activeStudents) {
        closeQuestionAndEmit();
      }
    }
    socket.emit('answer_ack');
  });

  socket.on('chat_message', ({ text }) => {
    const name = participants.get(socket.id)?.name || 'User';
    const payload = { id: nanoid(6), name, text: String(text || '').slice(0, 300), ts: Date.now() };
    io.emit('chat_message', payload);
  });

  socket.on('kick', ({ userId }) => {
    if (socket.data.role !== 'teacher') return;
    kickedIds.add(String(userId));
    for (const [sid, p] of participants.entries()) {
      if (p.id === String(userId)) {
        io.to(sid).emit('kicked');
        const s = io.sockets.sockets.get(sid);
        if (s) s.disconnect(true);
      }
    }
  });

  socket.on('fetch_history', () => {
    socket.emit('history', history.slice(-50));
  });

  socket.on('disconnect', () => {
    participants.delete(socket.id);
    io.emit('participants', Array.from(participants.values()).map(p => ({ id: p.id, name: p.name, role: p.role })));
  });
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`listening on ${PORT}`));
