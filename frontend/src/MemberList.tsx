// src/components/project/MemberList.tsx
type Props = { usuarios: string[] }; // emails

function Avatar({ email }: { email: string }) {
  const ini = email.charAt(0).toUpperCase();
  return (
    <div className="grid h-7 w-7 place-items-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-neutral-800 dark:text-neutral-200">
      {ini}
    </div>
  );
}

export default function MemberList({ usuarios }: Props) {
  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">Miembros</h4>
        <span className="pill border-gray-200 bg-gray-50 text-gray-600">{usuarios.length}</span>
      </div>
      {usuarios.length === 0 ? (
        <p className="text-xs text-gray-500">Aún no hay colaboradores.</p>
      ) : (
        <ul className="space-y-2">
          {usuarios.map((u) => (
            <li key={u} className="flex items-center gap-2">
              <Avatar email={u} />
              <span className="truncate text-sm">{u}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
