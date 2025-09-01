const express = require('express');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 4000;


app.use(express.json());
// Para pruebas rápidas. En producción, lo ideal es NO depender de CORS y usar reverse proxy.
app.use(cors());


// Demo de datos
let todos = [
{ id: 1, text: 'Aprender Docker', done: true },
{ id: 2, text: 'Conectar frontend y backend', done: false }
];


app.get('/api/health', (_req, res) => {
res.json({ ok: true, status: 'healthy', time: new Date().toISOString() });
});


app.get('/api/todos', (_req, res) => {
res.json(todos);
});


app.post('/api/todos', (req, res) => {
const { text } = req.body || {};
if (!text) return res.status(400).json({ error: 'text es requerido' });
const todo = { id: Date.now(), text, done: false };
todos.push(todo);
res.status(201).json(todo);
});


app.patch('/api/todos/:id', (req, res) => {
const id = Number(req.params.id);
const todo = todos.find(t => t.id === id);
if (!todo) return res.status(404).json({ error: 'No existe' });
Object.assign(todo, req.body);
res.json(todo);
});


app.delete('/api/todos/:id', (req, res) => {
const id = Number(req.params.id);
todos = todos.filter(t => t.id !== id);
res.status(204).end();
});


app.listen(PORT, () => {
console.log(`[api] Escuchando en http://localhost:${PORT}`);
});