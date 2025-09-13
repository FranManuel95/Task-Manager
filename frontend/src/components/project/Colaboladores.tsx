import { useState } from "react";
import { useTareasStore } from "../../store/tareasStore";

interface Props {
  proyectoId: string;
}

export default function Colaboradores({ proyectoId }: Props) {
  const [emailNuevo, setEmailNuevo] = useState("");
  const agregarColaborador = useTareasStore((state) => state.agregarColaborador);

  const handleAgregar = () => {
    const e = emailNuevo.trim().toLowerCase();
    if (!e) return;
    // opcional: validación simple de email
    // if (!/^\S+@\S+\.\S+$/.test(e)) return;
    agregarColaborador(proyectoId, e);
    setEmailNuevo("");
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-sm mb-2">Invitar colaborador</h3>
      <div className="flex gap-2">
        <input
          type="email"
          value={emailNuevo}
          onChange={(e) => setEmailNuevo(e.target.value)}
          placeholder="Correo del colaborador"
          className="border px-2 py-1 rounded w-full"
        />
        <button
          onClick={handleAgregar}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
