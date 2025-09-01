// src/pages/Home.tsx
import { motion } from "motion/react";
import Testimonials from "../components/marketing/Testimonials";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";

type Feature = {
  title: string;
  desc: string;
  icon: React.ReactNode;
};

type FAQ = {
  q: string;
  a: string;
};

const features: Feature[] = [
  {
    title: "Kanban ultra fluido",
    desc: "Arrastra y suelta tareas entre columnas con animaciones suaves y atajos de teclado.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        <path d="M4 5h5v14H4zM10 5h5v9h-5zM16 5h4v5h-4z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Colaboración en tiempo real",
    desc: "Invita a tu equipo y editen juntos proyectos y tareas. Chat interno incluido.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        <path d="M7 10a4 4 0 118 0 4 4 0 01-8 0zm-4 9a7 7 0 0116 0v1H3v-1z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Enfoque sin fricción",
    desc: "Búsqueda, filtros por prioridad y avisos de deadline para que nada se te pase.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        <path d="M12 22a10 10 0 100-20 10 10 0 000 20zm1-11h5v2h-7V6h2v5z" fill="currentColor" />
      </svg>
    ),
  },
];

const faqs: FAQ[] = [
  {
    q: "¿Puedo invitar colaboradores?",
    a: "Sí. Cualquier colaborador puede crear, editar, mover y eliminar tareas del proyecto.",
  },
  {
    q: "¿Necesito backend para empezar?",
    a: "No. Funciona local con persistencia y BroadcastChannel; podrás conectar backend cuando quieras.",
  },
  {
    q: "¿Tiene atajos de teclado?",
    a: "Sí: Enter para crear/guardar, Shift+Enter para saltos de línea, y más por venir.",
  },
];

export default function Home() {
  
    const usuario = useAuthStore((state) => state.usuario);
    const navigate = useNavigate();
    useEffect(() => {
        if (usuario) {
          navigate("/dashboard");
        }
      }, [usuario, navigate]);
  return (
    <div className="relative min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Fondo con gradientes sutiles */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-25 bg-gradient-to-tr from-blue-500 to-cyan-400" />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-fuchsia-500 to-purple-400" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 dark:bg-gray-950/60 border-b border-black/5 dark:border-white/10">
        <nav className="py-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/LogoTask-Manager2.png" alt="Logo" className="w-40 h-50" />
       
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:opacity-80">Características</a>
            <a href="#how" className="hover:opacity-80">Cómo funciona</a>
            <a href="#faq" className="hover:opacity-80">FAQ</a>
            <Link
              to="/proyectos"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:scale-[1.02] active:scale-[0.99] transition"
            >
              Ir a la app
              <span aria-hidden>↗</span>
            </Link>
          </div>
          <div className="md:hidden">
            {/* botón móvil simple (no drawer para mantener 1 archivo) */}
            <a
              href="#features"
              className="text-sm px-3 py-1 rounded-lg border border-black/10 dark:border-white/10"
            >
              Menú
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Gestiona tus proyectos con{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  claridad y velocidad
                </span>
                .
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Un tablero Kanban rápido, colaborativo y sin fricciones. Crea tareas, colabora con tu equipo y mantén los deadlines bajo control.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                     <Link
            to="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="border border-blue-600 text-blue-600 px-6 py-2 rounded hover:bg-blue-100 transition"
          >
            Registrarse
          </Link>
              </div>

              {/* Trust bar */}
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 opacity-80">
                <LogoBadge text="React + TS" />
                <LogoBadge text="Tailwind" />
                <LogoBadge text="Zustand" />
                <LogoBadge text="Vite" />
              </div>
            </motion.div>

            {/* Mockup simple */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-3 shadow-2xl">
                <img
                  src="/public/CapturaProyectoTareas.png"
                  alt="Vista previa del tablero Kanban"
                  className="rounded-xl w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 hidden sm:block">
                <KPIChip value="+35%" label="más tareas completadas" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <SectionHeading
              kicker="Características"
              title="Todo lo que necesitas para ejecutar"
              subtitle="Sin configuraciones complejas ni distracciones."
            />
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  className="rounded-xl border border-black/10 dark:border-white/10 p-5 bg-white/60 dark:bg-gray-900/60 backdrop-blur hover:shadow-lg transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <SectionHeading
              kicker="Cómo funciona"
              title="De cero a flujo en minutos"
              subtitle="Crea un proyecto, invita a tu equipo y empieza a mover tareas."
            />
            <ol className="mt-10 grid md:grid-cols-3 gap-6 counter-steps">
              {[
                { t: "Crea tu proyecto", d: "Define nombre, color y deadline opcional." },
                { t: "Invita a tu equipo", d: "Comparte el proyecto y chatead dentro." },
                { t: "Planifica y ejecuta", d: "Agrega tareas, define prioridades y cumple fechas." },
              ].map((s, i) => (
                <li
                  key={s.t}
                  className="relative rounded-xl border border-black/10 dark:border-white/10 p-6 bg-white/60 dark:bg-gray-900/60"
                >
                  <span className="step-index absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                  <h4 className="font-semibold">{s.t}</h4>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Testimonials */}
        <Testimonials className="border-t border-black/5 dark:border-white/10" />

        {/* FAQ */}
        <section id="faq" className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            <SectionHeading
              kicker="FAQ"
              title="Preguntas frecuentes"
              subtitle="Las dudas típicas, resueltas."
            />
            <div className="mt-10 divide-y divide-black/10 dark:divide-white/10 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
              {faqs.map((f, i) => (
                <details key={f.q} className="group open:bg-black/[0.02] dark:open:bg-white/[0.03]">
                  <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between">
                    <span className="font-medium">{f.q}</span>
                    <span className="transition group-open:rotate-180" aria-hidden>⌄</span>
                  </summary>
                  <div className="px-5 pb-5 pt-1 text-sm text-gray-600 dark:text-gray-300">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">¿Listo para elevar tu ejecución?</h2>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
              Crea un proyecto en segundos y empieza a entregar con foco.
            </p>
            <div className="mt-8 flex gap-3 justify-center">
              <Link
                to="/proyectos/nuevo"
                className="inline-flex rounded-xl px-5 py-3 bg-blue-600 text-white hover:bg-blue-700 transition shadow"
              >
                Crear proyecto
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="opacity-70">© {new Date().getFullYear()} Task Manager. Todos los derechos reservados.</p>
          <nav className="flex gap-4 opacity-80">
            <a href="#" className="hover:opacity-100">Privacidad</a>
            <a href="#" className="hover:opacity-100">Términos</a>
            <a href="#" className="hover:opacity-100">Contacto</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- small atoms ---------------- */
function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <span className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400">
        {kicker}
      </span>
      <h2 className="mt-2 text-3xl sm:text-4xl font-bold">{title}</h2>
      {subtitle && (
        <p className="mt-3 text-gray-600 dark:text-gray-300">{subtitle}</p>
      )}
    </div>
  );
}

function KPIChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-4 py-2 shadow">
      <span className="font-semibold">{value}</span>{" "}
      <span className="text-sm opacity-70">{label}</span>
    </div>
  );
}

function LogoBadge({ text }: { text: string }) {
  return (
    <div className="text-xs px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
      {text}
    </div>
  );
}


