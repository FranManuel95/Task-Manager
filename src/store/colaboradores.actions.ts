export const createColaboradorActions = (set: any, get: any) => ({
  agregarColaborador: (proyectoId: string, nuevoEmail: string) => {
    const email = get().usuarioActual;
    if (!email) return;

    const proyectos = get().proyectos;

    for (const usuario in proyectos) {
      const proyecto = proyectos[usuario][proyectoId];
      if (proyecto && proyecto.usuarios.includes(email)) {
        if (!proyecto.usuarios.includes(nuevoEmail)) {
          const nuevosUsuarios = [...proyecto.usuarios, nuevoEmail];

          set({
            proyectos: {
              ...proyectos,
              [usuario]: {
                ...proyectos[usuario],
                [proyectoId]: {
                  ...proyecto,
                  usuarios: nuevosUsuarios,
                },
              },
            },
          });
        }
        return;
      }
    }
  },
});
