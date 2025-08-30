export function validateTareaDeadline(
  deadline?: string | null,
  proyectoDeadline?: string | null
): boolean {
  if (
    deadline &&
    proyectoDeadline &&
    new Date(deadline) > new Date(proyectoDeadline)
  ) {
    alert("La fecha de la tarea no puede superar la fecha límite del proyecto");
    return false;
  }
  return true;
}
