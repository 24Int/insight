"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/config";

type Catalog = {
  id: string;
  name: string;
  image?: string | null;
};

function formatPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";

  let result = "+7 ";
  const withoutCountry =
    digits[0] === "7" || digits[0] === "8" ? digits.slice(1) : digits;

  if (withoutCountry.length > 0) {
    result += "(" + withoutCountry.slice(0, 3);
  }
  if (withoutCountry.length >= 4) {
    result += ") " + withoutCountry.slice(3, 6);
  }
  if (withoutCountry.length >= 7) {
    result += "-" + withoutCountry.slice(6, 8);
  }
  if (withoutCountry.length >= 9) {
    result += "-" + withoutCountry.slice(8, 10);
  }
  return result;
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);

  const phoneDisplay = formatPhoneMask(phoneRaw);

  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }

    return;
  }, [isModalOpen]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setCatalogsError(null);
        const res = await fetch(`${API_URL}/catalogs`);
        if (!res.ok) {
          throw new Error("Не удалось загрузить каталоги");
        }
        const data = (await res.json()) as Catalog[];
        setCatalogs(data);
      } catch (e) {
        setCatalogsError(
          e instanceof Error ? e.message : "Ошибка при загрузке каталогов"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openModal = () => {
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const digits = phoneRaw.replace(/\D/g, "");
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    if (digits.length < 10) {
      setError("Введите корректный номер телефона");
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phoneDisplay || phoneRaw,
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Не удалось отправить заявку");
      }
      setSuccess("Заявка успешно отправлена, мы свяжемся с вами.");
      setName("");
      setPhoneRaw("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка при отправке заявки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header
        className="fixed inset-x-0 top-0 z-40 bg-white border-b border-black/10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center p-4">
               <img 
        src="/logo.svg" 
        alt="Инсайт" 
        className="h-12 w-auto" 
      />
          <div className="flex justify-start items-center gap-4">
            <Link
              href={"tel:+79853555470"}
              className="hidden text-xs lg:inline-flex cursor-pointer text-neutral-700 hover:text-accent transition-all duration-300"
            >
              +7 (985) 355 54 70 
            </Link>
            <button
              onClick={openModal}
              className="inline-flex items-center justify-center cursor-pointer rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed border border-accent text-accent bg-white hover:bg-accent hover:text-white px-4 py-2"
            >
              Оставить заявку
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-10 pb-10">
        <section className="max-w-6xl mx-auto flex flex-col justify-center items-center p-4 mt-40">
          <div className="text-center max-w-3xl">
            <h1 className="text-2xl lg:text-3xl font-semibold leading-tight">
              Ваш надёжный партнёр в оптовых поставках{" "}
              <span className="text-accent">строительных материалов</span>
            </h1>
            <p className="my-4 text-sm lg:text-base">
              Комплексные оптовые поставки стройматериалов по России: от
              расходников до профессионального инструмента. Гарантированные
              сроки, стабильные цены и персональный менеджер под ваш объект.
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center justify-center cursor-pointer rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed bg-accent text-white hover:text-accent border border-accent hover:bg-transparent px-4 py-2"
            >
              Обсудить проект
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 lg:px-0">
          <div className="rounded-3xl bg-white border border-black/10 px-5 py-6 lg:px-7 lg:py-8 flex flex-col justify-center items-center lg:flex-row gap-6">
            <div className="flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
                Формат работы
              </p>
              <h2 className="mt-2 text-xl lg:text-2xl font-semibold">
                Берём на себя снабжение, чтобы вы думали только о стройке
              </h2>
              <p className="mt-3 text-sm text-neutral-600 max-w-xl">
                Вы присылаете спецификацию или задачу — мы подбираем материалы,
                согласуем аналоги, считаем смету и вывозим всё на объект в срок.
              </p>

              <div className="mt-5">
                <button
                  onClick={openModal}
                  className="inline-flex items-center justify-center cursor-pointer rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed bg-accent text-white hover:text-accent border border-accent hover:bg-transparent px-4 py-2"
                >
                  Обсудить проект
                </button>
              </div>
            </div>

            <div className="flex-1 grid gap-3 lg:gap-4">
              {[
                {
                  id: "01",
                  tag: "Логистика",
                  title: "Поставки точно в срок по всей России",
                  text: "Планируем отгрузки под ваш календарь работ, учитывая этапы и особенности площадки.",
                },
                {
                  id: "02",
                  tag: "Ассортимент",
                  title: "От расходников до инженерии",
                  text: "Сухие смеси, крепёж, инструмент, СИЗ, расходные материалы и многое другое в одном окне.",
                },
                {
                  id: "03",
                  tag: "Условия",
                  title: "Персональные цены и отсрочка",
                  text: "Персональные прайсы, фиксированные цены на срок проекта и возможная отсрочка платежа для постоянных клиентов.",
                },
              ].map(({ id, tag, title, text }) => (
                <div
                  key={id}
                  className="rounded-2xl border border-black/10 p-3 lg:p-4 flex gap-3"
                >
                  <div className="mt-1 h-9 w-9 rounded-2xl bg-accent/10 flex items-center justify-center text-[11px] font-semibold text-accent">
                    {id}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                      {tag}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">{title}</h3>
                    <p className="mt-1 text-xs text-neutral-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Catalogs */}
        <section className="max-w-6xl mx-auto px-4 lg:px-0">
          <div className="rounded-2xl bg-white border border-black/10 p-6">
            {loading && (
              <p className="text-xs text-neutral-500">Загружаем каталоги...</p>
            )}
            {catalogsError && (
              <p className="text-xs text-red-500">{catalogsError}</p>
            )}

            {!loading && !catalogsError && (
              <>
                <div className="mb-6 lg:mb-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h2 className="text-xl lg:text-2xl font-semibold">
                      Каталоги товаров
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600 max-w-xl">
                      Выберите интересующий каталог, чтобы посмотреть товары.
                    </p>
                  </div>
                </div>
                <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                  {catalogs.map((catalog) => (
                    <article
                      key={catalog.id}
                      className="flex flex-col rounded-2xl overflow-hidden border border-black/10 cursor-pointer transition hover:shadow-md"
                      onClick={() => {
                        window.location.href = `/catalog/${catalog.id}`;
                      }}
                    >
                      {catalog.image && (
                        <div className="h-28 w-full overflow-hidden">
                          <img
                            src={`${API_URL}${catalog.image}`}
                            alt={catalog.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-3 lg:p-4">
                        <h3 className="text-xs lg:text-sm font-semibold">
                          {catalog.name}
                        </h3>
                      </div>
                    </article>
                  ))}
                  {!catalogs.length && (
                    <p className="col-span-4 text-xs text-neutral-500">
                      Каталоги пока не добавлены.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Partners */}
        <section className="max-w-6xl mx-auto px-4 lg:px-0">
          <div className="rounded-3xl bg-white border border-black/10 px-4 py-4 lg:px-5 lg:py-5">
            <div className="mb-4 lg:mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl lg:text-2xl font-semibold">
                  С кем мы работаем
                </h2>
                <p className="mt-2 text-sm text-neutral-600 max-w-xl">
                  Нас выбирают компании, которым важно, чтобы материалы
                  приезжали вовремя, без сюрпризов по качеству и цене.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:gap-3">
              {[
                "Подрядчики и строительно-монтажные компании",
                "Девелоперы жилых и коммерческих объектов",
                "Производственные площадки и склады",
                "Ритейл и региональные оптовые компании",
              ].map((label, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent py-2 px-4"
                >
                  <span className="h-6 w-6 rounded-2xl bg-accent text-[10px] flex items-center justify-center text-white">
                    {(i + 1).toString().padStart(2)}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 lg:px-0">
          <div className="rounded-3xl bg-accent text-white">
            <div className="relative p-5 lg:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="max-w-xl">
                <h2 className="mt-2 text-xl lg:text-2xl font-semibold">
                  Пришлите спецификацию — за день подготовим коммерческое
                  предложение
                </h2>
              </div>
              <div className="shrink-0">
                <button
                  onClick={openModal}
                  className="inline-flex items-center justify-center cursor-pointer rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed border border-accent text-accent bg-white hover:bg-accent hover:text-white px-4 py-2"
                >
                  Оставить заявку
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Contacts */}
        <section className="max-w-6xl mx-auto px-4 lg:px-0">
          <div className="bg-white p-6 border border-black/10 rounded-3xl grid gap-4 lg:grid-cols-[2fr,3fr]">
            <div>
              <h2 className="text-xl lg:text-2xl font-semibold">Контакты</h2>
              <p className="mt-2 text-sm text-neutral-600 max-w-sm">
                Расскажите о своём проекте — подберём формат сотрудничества и
                подключим персонального менеджера.
              </p>

              {/* Контакты */}
              <div className="mt-4 space-y-2 text-sm text-neutral-700">
                {[
                  {
                    label: "Телефон:",
                    href: "tel:+79853555470",
                    value: "+7 (985) 355 54 70",
                  },
                  {
                    label: "E-mail:",
                    href: "mailto:info@24int.ru",
                    value: "info@24int.ru",
                  },
                ].map(({ label, href, value }) => (
                  <p key={label}>
                    <span className="text-neutral-500">{label} </span>
                    <a
                      href={href}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      {value}
                    </a>
                  </p>
                ))}

                <p className="text-neutral-500 text-xs mt-3">
                  Работаем по будням с 9:00 до 18:00 по Москве.
                </p>
              </div>

              {/* Факты */}
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-3 text-[11px] text-neutral-600">
                {[
                  {
                    title: "24 часа",
                    text: "максимальное время ответа на запрос",
                  },
                  { title: "3+ года", text: "средний срок работы с клиентами" },
                  { title: "РФ", text: "поставки по всей стране" },
                ].map(({ title, text }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-black/10 px-3 py-2"
                  >
                    <p className="text-xs font-semibold text-accent">{title}</p>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Правая колонка */}
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-4 text-xs text-neutral-500">
              <p className="font-medium text-neutral-700">География поставок</p>
              <p className="mt-2">
                Поставляем стройматериалы по всей России. Для крупных и
                регулярных поставок подбираем оптимальную схему логистики и
                складирования.
              </p>
              <p className="mt-3">
                Подробные реквизиты и договор отправим после первичного
                контакта.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 mt-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-0 py-4 flex flex-col lg:flex-row items-center justify-between gap-2 text-[11px] text-neutral-500">
          <p>
            © {new Date().getFullYear()} Инсайт. Оптовые поставки
            стройматериалов.
          </p>
          <p className="text-[10px]">
            Не является публичной офертой. Уточняйте наличие и цены у менеджера.
          </p>
        </div>
      </footer>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="w-full max-w-md animate-[fadeIn_160ms_ease-out] rounded-3xl border border-neutral-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.28)] backdrop-blur-xl lg:p-7"
          >
            <div className="mb-12 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="modal-title"
                  className="text-base font-semibold tracking-tight lg:text-lg"
                >
                  Заявка
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full border border-transparent px-2 py-1 text-xs text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-800"
              >
                Закрыть
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600">
                  Имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-white/60 px-3.5 py-2.5 text-base outline-none ring-0 transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10"
                  placeholder="Как к вам обращаться"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={phoneDisplay}
                  onChange={(e) => setPhoneRaw(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-white/60 px-3.5 py-2.5 text-base outline-none ring-0 transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10"
                  placeholder="+7 (___) ___-__-__"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 lg:text-[13px]">{error}</p>
              )}
              {success && (
                <p className="text-center text-emerald-700">{success}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black hover:shadow-md disabled:translate-y-0 disabled:bg-neutral-800 disabled:opacity-60"
              >
                {submitting ? "Отправляем..." : "Отправить заявку"}
              </button>

              <p className="pt-1 text-[10px] text-center leading-relaxed text-neutral-500">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных
                и получение обратного звонка.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
