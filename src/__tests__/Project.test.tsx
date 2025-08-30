// src/__tests__/Project.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, test, expect, beforeEach } from "vitest";

import Project from "../components/project/Project"; // ← ruta del componente real
import { useTareasStore } from "../store/tareasStore";

import {
  setupStoreForTests,
  resetTareasStore,
  TEST_PROYECTO_ID,
} from "./setupStoreForTests";

// Helper: render con router y la ruta que espera useProyectoActual (:id)
function renderProject() {
  return render(
    <MemoryRouter initialEntries={[`/proyecto/${TEST_PROYECTO_ID}`]}>
      <Routes>
        <Route path="/proyecto/:id" element={<Project />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Project component", () => {
  beforeEach(() => {
  resetTareasStore();
  setupStoreForTests();
});

  test("debería renderizar la tarea inicial", () => {
    renderProject();
    expect(screen.getByText("Tarea Test")).toBeInTheDocument();
  });

  test("debería permitir agregar una nueva tarea", () => {
    renderProject();

    // Usa el input de la PRIMERA columna ("por-hacer")
    const input = screen.getAllByPlaceholderText("Nueva tarea...")[0];
    fireEvent.change(input, { target: { value: "Nueva tarea desde test" } });

    const addBtn = screen.getAllByText("Agregar")[0];
    fireEvent.click(addBtn);

    expect(screen.getByText("Nueva tarea desde test")).toBeInTheDocument();
  });

  test("no debería agregar una tarea vacía", () => {
    renderProject();

    const tareasIniciales = screen.getAllByText(/Tarea Test/).length;

    const input = screen.getAllByPlaceholderText("Nueva tarea...")[0];
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getAllByText("Agregar")[0]);

    const tareasFinales = screen.getAllByText(/Tarea Test/).length;
    expect(tareasFinales).toBe(tareasIniciales);
  });

  test("debería permitir eliminar una tarea", async () => {
    renderProject();

    const eliminarBtn = screen.getByText("✕");
    fireEvent.click(eliminarBtn);

    await waitFor(() =>
      expect(screen.queryByText("Tarea Test")).not.toBeInTheDocument()
    );
  });

  test("debería permitir cambiar la prioridad de una tarea", () => {
    renderProject();

    // Entra en modo edición de la primera tarjeta
    const editBtn = screen.getByLabelText("Editar tarea");
    fireEvent.click(editBtn);

    // Selecciona el combobox de prioridad que muestra "media"
    const selectPrioridad = screen.getByLabelText("Prioridad") as HTMLSelectElement;
    expect(selectPrioridad).toBeInTheDocument();

    fireEvent.change(selectPrioridad, { target: { value: "alta" } });
    expect(selectPrioridad.value).toBe("alta");
  });

  test("filtra tareas por texto en el buscador", async () => {
    renderProject();

    fireEvent.change(screen.getByPlaceholderText("Buscar tareas..."), {
      target: { value: "inexistente" },
    });

    await waitFor(() =>
      expect(screen.queryByText("Tarea Test")).not.toBeInTheDocument()
    );
  });

  test("filtra tareas por prioridad", async () => {
    renderProject();

    // En la vista inicial solo hay un combobox visible: el filtro de prioridad del header
    const filtroPrioridad = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(filtroPrioridad, { target: { value: "alta" } });

    await waitFor(() =>
      expect(screen.queryByText("Tarea Test")).not.toBeInTheDocument()
    );
  });

  test("permite mover una tarea entre columnas (simulación vía store)", () => {
    renderProject();

    // Firma correcta: moverTarea(proyectoId, tareaId, destino)
    useTareasStore.getState().moverTarea(TEST_PROYECTO_ID, "1", "en-progreso");

    const email = useTareasStore.getState().usuarioActual!;
    const tareasEnProgreso =
      useTareasStore.getState().proyectos[email][TEST_PROYECTO_ID].tareas["en-progreso"];

    expect(tareasEnProgreso.some((t) => t.id === "1")).toBe(true);
  });

  test("debería permitir agregar etiquetas a una tarea", async () => {
    renderProject();

    const editBtn = screen.getByLabelText("Editar tarea");
    fireEvent.click(editBtn);

    const etiquetasInput = screen.getByPlaceholderText(/Etiquetas/);
    fireEvent.change(etiquetasInput, { target: { value: "urgente" } });
    fireEvent.keyDown(etiquetasInput, { key: "Enter" }); // añade la etiqueta

    // No hace falta "guardar" para que aparezca en la vista de edición
    await waitFor(() => {
      expect(screen.getByText("#urgente")).toBeInTheDocument();
    });
  });
});
