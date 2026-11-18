import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "¿Velociturno retiene el dinero de los anticipos?",
    a: "Nunca. Tu cliente transfiere el 50% directo a tu Nequi, Daviplata o Llave Bre-B. Velociturno solo le muestra tus datos y guarda la captura del comprobante para que la apruebes. La plata no pasa por nosotros y no cobramos comisión.",
  },
  {
    q: "¿Qué pasa si un cliente frecuente quiere agendar sin pagar anticipo?",
    a: "Tú decides. Puedes desactivar el anticipo para todo el negocio, o registrar la cita tú mismo desde el celular en segundos con el botón de cita rápida. Los clientes que llegan sin cita también se registran así, y ese espacio se bloquea al instante en tu página.",
  },
  {
    q: "¿WhatsApp puede bloquear mi número por enviar recordatorios?",
    a: "Los recordatorios son mensajes uno a uno sobre una cita que el cliente mismo agendó y autorizó al reservar. No son difusiones masivas ni publicidad. Enviamos uno de confirmación y uno 2 horas antes, a un ritmo controlado, para mantener tu número sano.",
  },
  {
    q: "¿Mis clientes tienen que descargar una aplicación?",
    a: "No. Abren tu enlace desde Instagram o WhatsApp, eligen servicio, barbero y hora, y listo. No crean cuenta ni contraseña: solo escriben su nombre y su número. Toma unos 30 segundos.",
  },
];

export function FaqSection() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-zinc-200 border-y border-zinc-200">
      {FAQS.map((item) => (
        <details key={item.q} className="faq-item group">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-semibold text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950">
            <span>{item.q}</span>
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-transform duration-200 ease-[var(--ease-out)] group-open:rotate-45 group-open:border-zinc-950 group-open:bg-zinc-950 group-open:text-white"
            >
              <Plus className="h-4 w-4" />
            </span>
          </summary>
          <p className="max-w-[65ch] pb-6 pr-12 text-[15px] leading-relaxed text-zinc-600">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
