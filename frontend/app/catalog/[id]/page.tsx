"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { API_URL } from "@/config";

type Product = {
  id: string;
  title: string;
  price: string;
  quantity: number;
  description?: string | null;
  image?: string | null;
};

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

export default function CatalogPage() {
  const params = useParams();
  const catalogId = params.id as string;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 8;
  const phoneDisplay = formatPhoneMask(phoneRaw);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorState(null);

        const [catalogRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/catalogs/${catalogId}`),
          fetch(`${API_URL}/products?catalog_id=${catalogId}`),
        ]);

        if (!catalogRes.ok) {
          throw new Error("Не удалось загрузить каталог");
        }
        if (!productsRes.ok) {
          throw new Error("Не удалось загрузить товары");
        }

        const catalogData = (await catalogRes.json()) as Catalog;
        const productsData = (await productsRes.json()) as Product[];

        setCatalog(catalogData);
        setProducts(productsData);
      } catch (e) {
        setErrorState(
          e instanceof Error ? e.message : "Ошибка при загрузке данных"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [catalogId]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(products.length / PAGE_SIZE)),
    [products.length]
  );

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [page, products]);

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
      <header className="w-full bg-white border-b border-black/10">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center p-4">
          <Link href={"/"}>
                           <img 
        src="/logo.svg" 
        alt="Инсайт" 
        className="h-12 w-auto" 
      />
          </Link>
          <div className="flex justify-start items-center gap-4">
            <Link
              href={"tel:+79990004300"}
              className="hidden text-xs lg:inline-flex cursor-pointer text-neutral-700 hover:text-accent transition-all duration-300"
            >
              +7 (999) 000 43 00
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
        {/* Catalog Header */}
        {catalog && (
          <section className="max-w-6xl mx-auto px-4 lg:px-0 mt-10">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/"
                className="text-sm text-neutral-600 hover:text-accent transition"
              >
                ← Назад к каталогам
              </Link>
            </div>
            <div className="rounded-2xl bg-white border border-black/10 p-6">
              <h1 className="text-2xl lg:text-3xl font-semibold">
                {catalog.name}
              </h1>
            </div>
          </section>
        )}

        {/* Products */}
        <section className="max-w-6xl mx-auto px-4 lg:px-0">
          <div className="rounded-2xl bg-white border border-black/10 p-6">
            {loading && (
              <p className="text-xs text-neutral-500">Загружаем товары...</p>
            )}
            {errorState && (
              <p className="text-xs text-red-500">{errorState}</p>
            )}

            {!loading && !errorState && (
              <>
                <div className="grid gap-6 lg:grid-cols-4">
                  {paginatedProducts.map((p) => (
                    <article
                      key={p.id}
                      className="flex flex-col rounded-2xl overflow-hidden border border-black/10"
                    >
                      {p.image && (
                        <div className="h-32 w-full overflow-hidden">
                          <img
                            src={`${API_URL}${p.image}`}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-3 lg:p-4">
                        <h3 className="text-xs lg:text-sm font-semibold line-clamp-2">
                          {p.title}
                        </h3>
                        {p.description && (
                          <p className="mt-1 text-[11px] text-neutral-600 line-clamp-3">
                            {p.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="font-semibold text-accent">
                            {Number(p.price).toLocaleString("ru-RU", {
                              style: "currency",
                              currency: "RUB",
                              maximumFractionDigits: 0,
                            })}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            На складе: {p.quantity} шт.
                          </span>
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={openModal}
                            className="w-full rounded-full bg-accent text-white border cursor-pointer border-accent px-3 py-2 font-medium transition hover:bg-transparent hover:text-accent"
                          >
                            Подробнее
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {!paginatedProducts.length && (
                    <p className="col-span-4 text-xs text-neutral-500">
                      Товары в этом каталоге пока не добавлены.
                    </p>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-[11px] text-neutral-600">
                    <span>
                      Страница {page} из {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className="rounded-full border border-neutral-200 px-3 py-1 disabled:opacity-40"
                      >
                        Назад
                      </button>
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        className="rounded-full border border-neutral-200 px-3 py-1 disabled:opacity-40"
                      >
                        Далее
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
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
                  className="w-full rounded-2xl border border-neutral-200 bg-white/60 px-3.5 py-2.5 text-sm outline-none ring-0 transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10"
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
                  className="w-full rounded-2xl border border-neutral-200 bg-white/60 px-3.5 py-2.5 text-sm outline-none ring-0 transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10"
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





