import { useState } from "react";
import { useTareasStore } from "../../store/tareasStore";

interface Props {
  proyectoId: string;
  isAdmin?: boolean; // NUEVO: por defecto false
}

export default function Colaboradores({ proyectoId, isAdmin = false }: Props) {
  const [emailNuevo, setEmailNuevo] = useState("");
  const agregarColaborador = useTareasStore(
    (state) => state.agregarColaborador,
  );

  const handleAgregar = () => {
    const e = emailNuevo.trim().toLowerCase();
    if (!e || !isAdmin) return;
    agregarColaborador(proyectoId, e);
    setEmailNuevo("");
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-sm mb-2">Invitar colaborador</h3>
      {!isAdmin && (
        <p className="text-xs text-gray-500 mb-2">
          Solo el administrador del proyecto puede invitar colaboradores.
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="email"
          value={emailNuevo}
          onChange={(e) => setEmailNuevo(e.target.value)}
          placeholder="Correo del colaborador"
          className="border px-2 py-1 rounded w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!isAdmin}
        />
        <button
          onClick={handleAgregar}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!isAdmin || !emailNuevo.trim()}
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
