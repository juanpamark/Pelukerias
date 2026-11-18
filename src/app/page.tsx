import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  LayoutGrid,
  Link2,
  MessageCircle,
  QrCode,
  Share2,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { UrlSimulator } from "@/components/landing/UrlSimulator";
import { LossCalculator } from "@/components/landing/LossCalculator";
import { HeroMotionReel } from "@/components/landing/HeroMotionReel";
import { FaqSection } from "@/components/landing/FaqSection";
import { MobileMenu } from "@/components/landing/MobileMenu";

const enter = (delay: number): CSSProperties => ({ ["--delay" as string]: `${delay}ms` });

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950">
      {/* Header: acceso sutil + menú hamburguesa en móvil/tablet */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <BrandLogo href="/" />

          <nav aria-label="Navegación principal" className="hidden items-center gap-7 md:flex">
            <a href="#como-funciona" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
              Cómo funciona
            </a>
            <a href="#calculadora" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
              Calculadora
            </a>
            <a href="#planes" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
              Planes
            </a>
            <a href="#preguntas" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
              Preguntas
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="pressable inline-flex min-h-[40px] items-center rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 sm:px-4 sm:text-sm"
            >
              Iniciar sesión
            </Link>
            <MobileMenu />
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section id="crear" className="relative overflow-hidden border-b border-zinc-200 bg-zinc-50">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_30%_20%,black_20%,transparent_70%)] opacity-60"
          />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-12 lg:gap-14 lg:py-24">
            <div className="min-w-0 lg:col-span-7">
              <h1
                className="hero-enter text-balance text-[2.45rem] font-extrabold leading-[1.04] tracking-[-0.035em] text-zinc-950 sm:text-5xl lg:text-[4rem]"
                style={enter(0)}
              >
                Cero sillas vacías y cero clientes que te dejan plantado.
              </h1>
              <p
                className="hero-enter mt-5 max-w-[56ch] text-base leading-relaxed text-zinc-600 sm:mt-6 sm:text-lg"
                style={enter(120)}
              >
                Tus clientes agendan en 30 segundos desde un enlace propio, pagan el{" "}
                <strong className="font-semibold text-zinc-950">
                  50% de anticipo directo a tu Nequi
                </strong>{" "}
                (sin comisiones) y reciben recordatorios automáticos desde tu WhatsApp.
              </p>

              <div className="hero-enter mt-7 max-w-xl sm:mt-8" style={enter(220)}>
                <UrlSimulator />
              </div>

              <ul
                className="hero-enter hero-enter-fade mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600"
                style={enter(300)}
              >
                {["14 días gratis", "Sin tarjeta de crédito", "0% comisión por transferencia"].map(
                  (item) => (
                    <li key={item} className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-600" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="hero-enter min-w-0 lg:col-span-5" style={enter(160)}>
              <HeroMotionReel />
            </div>
          </div>
        </section>

        {/* ESTÁNDAR DEL SECTOR (Sin reseñas ficticias) */}
        <section aria-label="Cómo operan las barberías modernas" className="border-b border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:py-12">
            <div className="min-w-0 lg:col-span-5">
              <h2 className="text-balance text-xl font-extrabold tracking-tight text-zinc-950 sm:text-2xl">
                El modelo que miles de peluquerías y barberías usan para dejar de perder citas.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Las barberías más rentables ya cambiaron el cuaderno y el chat manual por reservas
                en línea con anticipo y recordatorios automáticos.
              </p>
            </div>

            <dl className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7 lg:border-l lg:border-zinc-200 lg:pl-8">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <dt className="text-xs font-medium text-zinc-500">Para tu cliente</dt>
                <dd className="tabular-nums mt-1 text-2xl font-extrabold tracking-tight text-zinc-950">
                  30 seg
                </dd>
                <p className="mt-1 text-xs text-zinc-600">Agenda desde el navegador sin bajar apps</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <dt className="text-xs font-medium text-zinc-500">Aviso por WhatsApp</dt>
                <dd className="tabular-nums mt-1 text-2xl font-extrabold tracking-tight text-zinc-950">
                  2 horas antes
                </dd>
                <p className="mt-1 text-xs text-zinc-600">Recordatorio automático desde tu número</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <dt className="text-xs font-medium text-emerald-800">Anticipo 50%</dt>
                <dd className="tabular-nums mt-1 text-2xl font-extrabold tracking-tight text-emerald-700">
                  0% comisión
                </dd>
                <p className="mt-1 text-xs text-emerald-900/80">La plata entra directo a tu Nequi</p>
              </div>
            </dl>
          </div>
        </section>

        {/* CÓMO FUNCIONA EN 3 MINUTOS */}
        <section id="como-funciona" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl">
              Listo en 3 minutos. Sin instalar nada.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
              Si sabes publicar una historia en Instagram, sabes usar Velociturno.
            </p>

            <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 md:grid-cols-3">
              {[
                {
                  icon: Link2,
                  title: "Crea tu enlace",
                  body: "Escribe el nombre de tu barbería, agrega tus barberos y tu menú con precios y duraciones.",
                },
                {
                  icon: Share2,
                  title: "Pégalo en tu Instagram y WhatsApp",
                  body: "Ponlo en la biografía, en tus estados y en el QR del mostrador. Tus clientes agendan solos.",
                },
                {
                  icon: Wallet,
                  title: "Aprueba el Nequi en 1 toque",
                  body: "Cada reserva llega con la captura del anticipo. La revisas y confirmas entre corte y corte.",
                },
              ].map((step, i) => (
                <li key={step.title} className="flex flex-col bg-white p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
                      <step.icon className="h-5 w-5" />
                    </span>
                    <span className="tabular-nums text-sm font-bold text-zinc-300">
                      Paso {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-zinc-950">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CARACTERÍSTICAS */}
        <section className="border-t border-zinc-200 bg-zinc-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="max-w-3xl text-balance text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl">
              Todo lo que pasa en tu barbería, controlado desde el celular
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12">
              <article className="min-w-0 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-9 lg:col-span-7">
                <CalendarClock className="h-6 w-6 text-zinc-950" />
                <h3 className="mt-5 text-2xl font-bold tracking-tight text-zinc-950">
                  Agenda sin huecos muertos
                </h3>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-zinc-600">
                  Si un corte de 45 minutos termina a las 9:45, el siguiente turno se ofrece a las
                  9:45 en punto. No a las 10:00. Esos 15 minutos por cita son plata.
                </p>

                <div className="mt-8 space-y-2.5" aria-hidden="true">
                  {[
                    { time: "9:00 – 9:45", name: "Corte Platinum · Sebastián", tone: "done" },
                    { time: "9:45 – 10:30", name: "Corte Gold · Juan", tone: "tight" },
                    { time: "10:30 – 11:00", name: "Barba · Nicolás", tone: "normal" },
                  ].map((row) => (
                    <div
                      key={row.time}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 px-4 py-3 sm:flex-nowrap sm:gap-4"
                    >
                      <span className="tabular-nums shrink-0 text-xs font-bold text-zinc-500 sm:w-28">
                        {row.time}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
                        {row.name}
                      </span>
                      {row.tone === "tight" && (
                        <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          0 min perdidos
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </article>

              <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
                <article className="rounded-3xl bg-zinc-950 p-6 text-white sm:p-8">
                  <Wallet className="h-6 w-6 text-emerald-400" />
                  <h3 className="mt-5 text-xl font-bold tracking-tight">Anticipo del 50% a tu Nequi</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                    Sin pasarelas ni comisiones. El cliente copia tu Nequi, Daviplata o Llave
                    Bre-B y sube la captura al reservar.
                  </p>
                  <p className="tabular-nums mt-6 text-4xl font-extrabold tracking-tight text-emerald-400">
                    $0 <span className="text-base font-semibold text-zinc-400">de comisión</span>
                  </p>
                </article>

                <article className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
                  <MessageCircle className="h-6 w-6 text-emerald-600" />
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-zinc-950">
                    Recordatorios desde tu propio WhatsApp
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
                    Conectas tu WhatsApp Business con un QR. El cliente recibe la confirmación y
                    un aviso 2 horas antes, con el nombre de tu barbería.
                  </p>
                </article>
              </div>

              <ul className="grid min-w-0 grid-cols-1 gap-px overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 sm:grid-cols-3 lg:col-span-12">
                {[
                  {
                    icon: LayoutGrid,
                    title: "Agenda por silla o por lista",
                    body: "En el computador ves todas las sillas lado a lado. En el celular, la lista del día con acciones en 1 toque.",
                  },
                  {
                    icon: Star,
                    title: "Precios por nivel",
                    body: "Un mismo corte puede costar distinto con un barbero Estándar, Gold o Platinum.",
                  },
                  {
                    icon: QrCode,
                    title: "QR para tu mostrador",
                    body: "Descárgalo, imprímelo y que el cliente agende su próximo corte antes de salir.",
                  },
                ].map((f) => (
                  <li key={f.title} className="bg-white p-6 sm:p-7">
                    <f.icon className="h-5 w-5 text-zinc-950" />
                    <h3 className="mt-4 text-base font-bold text-zinc-950">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{f.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CALCULADORA */}
        <section id="calculadora" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <LossCalculator />
          </div>
        </section>

        {/* PLANES */}
        <section id="planes" className="scroll-mt-16 border-t border-zinc-200 bg-zinc-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl">
                Invierte menos de lo que vale un corte al día
              </h2>
              <p className="mt-4 text-base text-zinc-600">
                El Plan Pro sale a unos $2.600 diarios. Sin permanencia, sin costo por reserva.
                Empieza gratis 14 días.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
              <PlanCard
                name="Plan Básico"
                price="$39.000"
                badge="Más popular"
                description="Para barberos independientes o locales pequeños."
                features={[
                  "Tu página propia: velociturno.com/tunegocio",
                  "Anticipo del 50% por Nequi, Daviplata o Llave Bre-B",
                  "Hasta 2 barberos activos",
                  "Agenda sin huecos muertos",
                  "Citas ilimitadas y QR para el mostrador",
                ]}
                cta="Probar 14 días gratis"
              />
              <PlanCard
                highlighted
                name="Plan Pro"
                price="$79.000"
                badge="Recomendado"
                description="Todo lo del Básico, más automatización para que nadie te deje plantado."
                features={[
                  "Barberos y sillas ilimitadas",
                  "Recordatorios automáticos desde tu propio WhatsApp",
                  "Precios por nivel: Estándar, Gold y Platinum",
                  "Reseñas verificadas de tus clientes",
                  "Métricas de ingresos del mes",
                ]}
                cta="Empezar con Plan Pro"
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="preguntas" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="mx-auto max-w-2xl text-balance text-center text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl">
              Preguntas que nos hacen los barberos
            </h2>
            <div className="mt-12">
              <FaqSection />
            </div>
          </div>
        </section>

        {/* CIERRE */}
        <section className="px-5 pb-16 sm:px-8 sm:pb-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-3xl bg-zinc-950 px-6 py-10 sm:px-12 sm:py-12 md:flex-row md:items-center">
            <div>
              <h2 className="text-balance text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                Tu próxima silla vacía puede ser la última.
              </h2>
              <p className="mt-3 max-w-lg text-sm text-zinc-400 sm:text-base">
                Crea tu página hoy y compártela en tu Instagram esta misma tarde.
              </p>
            </div>
            <Link
              href="#crear"
              className="pressable inline-flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-zinc-950 hover:bg-emerald-400 md:w-auto"
            >
              Ver cómo quedaría mi página
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center">
          <div>
            <BrandLogo href="/" size="sm" />
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Plataforma segura en la nube</span>
              <span aria-hidden="true">•</span>
              <span>Tus datos y transferencias van directo a tu cuenta</span>
              <span aria-hidden="true">•</span>
              <span>Soporte en Colombia</span>
            </p>
          </div>
          <nav aria-label="Enlaces del pie" className="flex flex-wrap items-center gap-6 text-sm text-zinc-600">
            <Link href="/los-reyes" className="hover:text-zinc-950">
              Ver ejemplo real
            </Link>
            <a href="#planes" className="hover:text-zinc-950">
              Planes
            </a>
            <Link href="/dashboard" className="hover:text-zinc-950">
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function PlanCard({
  name,
  price,
  badge,
  description,
  features,
  cta,
  highlighted = false,
}: {
  name: string;
  price: string;
  badge: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "flex flex-col overflow-hidden rounded-3xl border-2 border-zinc-950 bg-white shadow-[0_24px_48px_-24px_rgba(9,9,11,0.35)]"
          : "flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white"
      }
    >
      <div
        className={
          highlighted
            ? "flex items-center justify-start bg-zinc-950 px-6 py-2.5 text-xs font-bold text-emerald-400 sm:px-8"
            : "flex items-center justify-start border-b border-zinc-200 bg-zinc-100 px-6 py-2.5 text-xs font-bold text-zinc-900 sm:px-8"
        }
      >
        <span>{badge}</span>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <h3 className="text-xl font-bold text-zinc-950">{name}</h3>
        <p className="mt-1.5 text-sm text-zinc-500">{description}</p>
        <p className="mt-6 flex items-baseline gap-1.5">
          <span className="tabular-nums text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl">
            {price}
          </span>
          <span className="text-sm font-medium text-zinc-500">COP / mes</span>
        </p>

        <ul className="mt-8 flex-1 space-y-3.5 text-sm text-zinc-700">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          href="#crear"
          className={
            highlighted
              ? "pressable mt-8 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
              : "pressable mt-8 inline-flex min-h-[50px] items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
          }
        >
          {cta}
          {highlighted && <ArrowRight className="h-4 w-4" />}
        </Link>
      </div>
    </div>
  );
}
