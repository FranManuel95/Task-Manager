import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, beforeEach } from "vitest";
import Project from "../pages/Project";
import { setupStore } from "../store/setupStoreForTests";
import { useTareasStore } from "../store/tareasStore"; // ✅ IMPORTACIÓN NECESARIA

describe("Project component", () => {
  beforeEach(() => {
    setupStore(); // Reinicia el store antes de cada test
  });

  test("debería renderizar la tarea inicial", () => {
    render(<MemoryRouter><Project /></MemoryRouter>);
    expect(screen.getByText("Tarea Test")).toBeInTheDocument();
  });

  test("debería permitir agregar una nueva tarea", () => {
    render(<MemoryRouter><Project /></MemoryRouter>);
    const input = screen.getAllByPlaceholderText("Nueva tarea...")[0];
    fireEvent.change(input, { target: { value: "Nueva tarea desde test" } });
    fireEvent.click(screen.getAllByText("Agregar")[0]);
    expect(screen.getByText("Nueva tarea desde test")).toBeInTheDocument();
  });

  test("no debería agregar una tarea vacía", () => {
    render(
      <MemoryRouter>
        <Project />
      </MemoryRouter>
    );
  
    const tareasIniciales = screen.getAllByText(/Tarea Test/).length;
  
    const input = screen.getAllByPlaceholderText("Nueva tarea...")[0];
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getAllByText("Agregar")[0]);
  
    const tareasFinales = screen.getAllByText(/Tarea Test/).length;
    expect(tareasFinales).toBe(tareasIniciales); // no aumentó
  });
  

  test("debería permitir eliminar una tarea", async () => {
    render(<MemoryRouter><Project /></MemoryRouter>);
    const eliminarBtn = screen.getByText("✕");
    fireEvent.click(eliminarBtn);

    await waitFor(() =>
      expect(screen.queryByText("Tarea Test")).not.toBeInTheDocument()
    );
  });

  test("debería permitir cambiar la prioridad de una tarea", () => {
    render(<MemoryRouter><Project /></MemoryRouter>);
    const editBtn = screen.getByTitle("Editar tarea");
    fireEvent.click(editBtn);

    const selects = screen.getAllByRole("combobox");
    const selectPrioridad = selects.find((sel) => sel.value === "media");

    expect(selectPrioridad).toBeInTheDocument();
    fireEvent.change(selectPrioridad, { target: { value: "alta" } });
    expect(selectPrioridad.value).toBe("alta");
  });

  test("filtra tareas por texto en el buscador", async () => {
    render(<MemoryRouter><Project /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText("Buscar tareas..."), {
      target: { value: "inexistente" },
    });

    await waitFor(() =>
      expect(screen.queryByText("Tarea Test")).not.toBeInTheDocument()
    );
  });

  test("filtra tareas por prioridad", async () => {
    render(<MemoryRouter><Project /></MemoryRouter>);
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "alta" },
    });

    await waitFor(() =>
      expect(screen.queryByText("Tarea Test")).not.toBeInTheDocument()
    );
  });

  test("permite mover una tarea entre columnas", () => {
    render(<MemoryRouter><Project /></MemoryRouter>);
    // Simulación directa de moverTarea desde el store
    useTareasStore.getState().moverTarea("1", "en-progreso");

    expect(
      useTareasStore.getState().tareas["en-progreso"].some((t) => t.id === "1")
    ).toBe(true);
  });
});
