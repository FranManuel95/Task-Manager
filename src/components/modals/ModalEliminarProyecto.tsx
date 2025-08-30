// src/components/modals/ModalEliminarProyecto.tsx

type Props = {
  onClose: () => void;
  onConfirm: () => void;
};

export default function ModalEliminarProyecto({ onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-red-600">Eliminar proyecto</h2>
        <p className="mb-4 text-gray-700">
          ¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
