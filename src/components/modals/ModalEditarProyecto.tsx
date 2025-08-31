// src/components/modals/ModalEditarProyecto.tsx
import { FormEvent } from "react";

type Props = {
  nuevoNombre: string;
  nuevaDescripcion: string;
  nuevoColor: string;
  nuevoDeadline: string;
  onChangeNombre: (val: string) => void;
  onChangeDescripcion: (val: string) => void;
  onChangeColor: (val: string) => void;
  onChangeDeadline: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
};

export default function ModalEditarProyecto({
  nuevoNombre,
  nuevaDescripcion,
  nuevoColor,
  nuevoDeadline,
  onChangeNombre,
  onChangeDescripcion,
  onChangeColor,
  onChangeDeadline,
  onClose,
  onSubmit,
}: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100/70 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Editar proyecto</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => onChangeNombre(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
          <textarea
            value={nuevaDescripcion}
            onChange={(e) => onChangeDescripcion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <label className="block text-sm font-medium text-gray-700">
            Color del proyecto
          </label>
          <input
            type="color"
            value={nuevoColor}
            onChange={(e) => onChangeColor(e.target.value)}
            className="w-16 h-10 cursor-pointer"
          />
          <label className="block text-sm font-medium text-gray-700">
            Fecha de entrega
          </label>
          <input
            type="date"
            value={nuevoDeadline}
            onChange={(e) => onChangeDeadline(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
