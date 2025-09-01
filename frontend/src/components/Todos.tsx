import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/api';
import { Todo } from '../types/todos';

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiGet<Todo[]>('/todos')
      .then(setTodos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function addTodo() {
    if (!text.trim()) return;
    try {
      const created = await apiPost<Todo>('/todos', { text });
      setTodos(t => [created, ...t]);
      setText('');
    } catch (e:any) { setError(e.message); }
  }

  async function toggleDone(id: number, done: boolean) {
    try {
      const updated = await apiPatch<Todo>(`/todos/${id}`, { done: !done });
      setTodos(t => t.map(x => x.id === id ? updated : x));
    } catch (e:any) { setError(e.message); }
  }

  async function removeTodo(id: number) {
    const prev = todos;
    setTodos(t => t.filter(x => x.id !== id));
    try { await apiDelete(`/todos/${id}`); }
    catch (e:any) { setError(e.message); setTodos(prev); }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Todos</h1>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nuevo todo…"
        />
        <button className="bg-black text-white px-4 py-2 rounded" onClick={addTodo}>
          Añadir
        </button>
      </div>

      {loading && <p>Cargando…</p>}
      {error && <p className="text-red-600">{error}</p>}

      <ul className="space-y-2">
        {todos.map(t => (
          <li key={t.id} className="border rounded px-3 py-2 flex items-center justify-between">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={t.done} onChange={() => toggleDone(t.id, t.done)} />
              <span className={t.done ? 'line-through opacity-60' : ''}>{t.text}</span>
            </label>
            <div className="flex items-center gap-3 text-sm">
              <span className="opacity-60">#{t.id}</span>
              <button className="text-red-600" onClick={() => removeTodo(t.id)}>Borrar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
