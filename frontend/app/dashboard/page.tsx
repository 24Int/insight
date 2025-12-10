"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config";

type Product = {
  id: string;
  title: string;
  price: string;
  quantity: number;
  description?: string | null;
  image?: string | null;
  catalog_id?: string | null;
};

type Catalog = {
  id: string;
  name: string;
  image?: string | null;
};

type RequestItem = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
};

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: "",
    price: "",
    quantity: "",
    description: "",
    catalog_id: "",
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [catalogForm, setCatalogForm] = useState({
    name: "",
  });
  const [catalogImageFile, setCatalogImageFile] = useState<File | null>(null);
  const [catalogImagePreview, setCatalogImagePreview] = useState<string | null>(null);
  const [savingCatalog, setSavingCatalog] = useState(false);

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("insight_token");
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        setLoadingData(true);
        setDataError(null);

        const [productsRes, catalogsRes, requestsRes] = await Promise.all([
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/catalogs`),
          fetch(`${API_URL}/requests`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!productsRes.ok) {
          throw new Error("Не удалось загрузить товары");
        }
        if (!catalogsRes.ok) {
          throw new Error("Не удалось загрузить каталоги");
        }
        if (!requestsRes.ok) {
          throw new Error("Не удалось загрузить заявки");
        }

        const productsData = (await productsRes.json()) as Product[];
        const catalogsData = (await catalogsRes.json()) as Catalog[];
        const requestsData = (await requestsRes.json()) as RequestItem[];

        setProducts(productsData);
        setCatalogs(catalogsData);
        setRequests(
          requestsData.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
      } catch (e) {
        setDataError(e instanceof Error ? e.message : "Ошибка загрузки данных");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [token]);

  const filteredRequests = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return requests;
    return requests.filter((r) => {
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        new Date(r.created_at).toLocaleString("ru-RU").includes(q)
      );
    });
  }, [requests, search]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      setAuthLoading(true);
      const body = new URLSearchParams();
      body.set("username", username);
      body.set("password", password);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        throw new Error("Неверный логин или пароль");
      }

      const data = (await res.json()) as TokenResponse;
      setToken(data.access_token);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("insight_token", data.access_token);
      }
      setPassword("");
    } catch (e) {
      setAuthError(
        e instanceof Error
          ? e.message
          : "Ошибка авторизации, попробуйте ещё раз"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("insight_token");
    }
  };

  const startCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: "",
      price: "",
      quantity: "",
      description: "",
      catalog_id: "",
    });
    setProductImageFile(null);
    setProductImagePreview(null);
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      description: product.description || "",
      catalog_id: product.catalog_id || "",
    });
    setProductImageFile(null);
    setProductImagePreview(product.image ? `${API_URL}${product.image}` : null);
  };

  const startCreateCatalog = () => {
    setEditingCatalog(null);
    setCatalogForm({
      name: "",
    });
    setCatalogImageFile(null);
    setCatalogImagePreview(null);
  };

  const startEditCatalog = (catalog: Catalog) => {
    setEditingCatalog(catalog);
    setCatalogForm({
      name: catalog.name,
    });
    setCatalogImageFile(null);
    setCatalogImagePreview(catalog.image ? `${API_URL}${catalog.image}` : null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSavingProduct(true);

      const formData = new FormData();
      formData.append("title", productForm.title.trim());
      formData.append("price", productForm.price);
      formData.append("quantity", productForm.quantity || "0");
      if (productForm.description.trim()) {
        formData.append("description", productForm.description.trim());
      }
      if (productForm.catalog_id) {
        formData.append("catalog_id", productForm.catalog_id);
      }
      if (productImageFile) {
        formData.append("image", productImageFile);
      }

      const isEdit = !!editingProduct;
      const url = isEdit
        ? `${API_URL}/products/${editingProduct!.id}`
        : `${API_URL}/products`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Не удалось сохранить товар");
      }
      const saved = (await res.json()) as Product;

      setProducts((prev) => {
        if (isEdit) {
          return prev.map((p) => (p.id === saved.id ? saved : p));
        }
        return [saved, ...prev];
      });

      setEditingProduct(null);
      setProductForm({
        title: "",
        price: "",
        quantity: "",
        description: "",
        catalog_id: "",
      });
      setProductImageFile(null);
      setProductImagePreview(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка при сохранении товара");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSaveCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSavingCatalog(true);

      const formData = new FormData();
      formData.append("name", catalogForm.name.trim());
      if (catalogImageFile) {
        formData.append("image", catalogImageFile);
      }

      const isEdit = !!editingCatalog;
      const url = isEdit
        ? `${API_URL}/catalogs/${editingCatalog!.id}`
        : `${API_URL}/catalogs`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Не удалось сохранить каталог");
      }
      const saved = (await res.json()) as Catalog;

      setCatalogs((prev) => {
        if (isEdit) {
          return prev.map((c) => (c.id === saved.id ? saved : c));
        }
        return [saved, ...prev];
      });

      setEditingCatalog(null);
      setCatalogForm({
        name: "",
      });
      setCatalogImageFile(null);
      setCatalogImagePreview(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка при сохранении каталога");
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleDeleteCatalog = async (catalog: Catalog) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Удалить каталог "${catalog.name}"? Это действие необратимо.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/catalogs/${catalog.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Не удалось удалить каталог");
      }
      setCatalogs((prev) => prev.filter((c) => c.id !== catalog.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка при удалении каталога");
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Удалить товар "${product.title}"? Это действие необратимо.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/products/${product.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Не удалось удалить товар");
      }
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка при удалении товара");
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-neutral-900">
        <div className="w-full max-w-sm rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-7">
          <div className="mb-5 space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-accent">
              Инсайт
            </p>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Админ-панель
            </h1>
            <p className="text-xs text-neutral-500">
              Введите логин и пароль, чтобы управлять товарами и заявками с
              сайта.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600">
                Логин
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-white/60 px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10"
                placeholder="admin"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-white/60 px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-500 sm:text-[13px]">{authError}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="mt-1 flex w-full items-center justify-center rounded-full border border-accent bg-accent px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-md disabled:translate-y-0 disabled:bg-accent/60 disabled:opacity-70"
            >
              {authLoading ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-neutral-900">
      <header className="border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent text-xs font-semibold tracking-[0.08em] text-white">
              IN
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">
                Инсайт
              </span>
              <h1 className="text-[17px] font-semibold tracking-tight lg:text-lg">
                Админ-панель
              </h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium tracking-[0.08em] uppercase text-neutral-700 transition hover:border-red-400 hover:bg-red-50 hover:text-red-500"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8 lg:py-8">
        {/* Catalogs management */}
        <section className="flex-1 space-y-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Каталоги</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Управляйте каталогами товаров.
              </p>
            </div>
            <button
              onClick={startCreateCatalog}
              className="self-start rounded-full border border-accent px-3 py-1.5 text-xs font-medium tracking-[0.08em] uppercase text-accent transition hover:bg-accent hover:text-white"
            >
              Новый каталог
            </button>
          </div>

          <form
            onSubmit={handleSaveCatalog}
            className="space-y-3 rounded-2xl border border-black/10 bg-neutral-50/60 p-3 text-sm"
          >
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                Название каталога
              </label>
              <input
                type="text"
                value={catalogForm.name}
                onChange={(e) =>
                  setCatalogForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                Фотография каталога
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCatalogImageFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setCatalogImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
              {catalogImagePreview && (
                <div className="mt-2">
                  <img
                    src={catalogImagePreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-neutral-500">
                {editingCatalog
                  ? `Редактирование: ${editingCatalog.name}`
                  : "Создание нового каталога"}
              </span>
              <button
                type="submit"
                disabled={savingCatalog}
                className="rounded-full border border-accent bg-accent px-4 py-1.5 text-xs font-medium text-white transition hover:-translate-y-0.5 hover:bg-accent/90 disabled:translate-y-0 disabled:bg-accent/60 disabled:opacity-70"
              >
                {savingCatalog ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">
              Список каталогов
            </h3>
            {loadingData && (
              <p className="text-xs text-neutral-500">Загружаем данные...</p>
            )}
            {dataError && <p className="text-xs text-red-500">{dataError}</p>}
            <div className="max-h-[360px] overflow-auto rounded-2xl border border-black/10 bg-white text-xs">
              <table className="min-w-full border-collapse">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-medium text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Название
                    </th>
                    <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-medium text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catalogs.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50">
                      <td className="border-b border-neutral-100 px-2 py-1.5 text-neutral-900">
                        {c.name}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-1.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditCatalog(c)}
                            className="rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] text-neutral-700 transition hover:bg-neutral-900 hover:text-white"
                          >
                            Изм.
                          </button>
                          <button
                            onClick={() => handleDeleteCatalog(c)}
                            className="rounded-full border border-red-300 px-2 py-0.5 text-[11px] text-red-600 transition hover:bg-red-500 hover:text-white"
                          >
                            Удал.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {catalogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-2 py-2 text-center text-neutral-500"
                      >
                        Каталогов пока нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Products management */}
        <section className="flex-1 space-y-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Товары</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Управляйте номенклатурой, которая отображается на главной
                странице.
              </p>
            </div>
            <button
              onClick={startCreateProduct}
              className="self-start rounded-full border border-accent px-3 py-1.5 text-xs font-medium tracking-[0.08em] uppercase text-accent transition hover:bg-accent hover:text-white"
            >
              Новый товар
            </button>
          </div>

          <form
            onSubmit={handleSaveProduct}
            className="space-y-3 rounded-2xl border border-black/10 bg-neutral-50/60 p-3 text-sm"
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                  Название
                </label>
                <input
                  type="text"
                  value={productForm.title}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                  Цена (₽)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, price: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                  Количество
                </label>
                <input
                  type="number"
                  value={productForm.quantity}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                  Каталог
                </label>
                <select
                  value={productForm.catalog_id}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, catalog_id: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
                >
                  <option value="">Без каталога</option>
                  {catalogs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                Фотография товара
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProductImageFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setProductImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
              {productImagePreview && (
                <div className="mt-2">
                  <img
                    src={productImagePreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                </div>
              )}
            </div>
            <div className="space-y-1 pt-1">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                Описание
              </label>
              <textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-900 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-neutral-500">
                {editingProduct
                  ? `Редактирование: ${editingProduct.title}`
                  : "Создание нового товара"}
              </span>
              <button
                type="submit"
                disabled={savingProduct}
                className="rounded-full border border-accent bg-accent px-4 py-1.5 text-xs font-medium text-white transition hover:-translate-y-0.5 hover:bg-accent/90 disabled:translate-y-0 disabled:bg-accent/60 disabled:opacity-70"
              >
                {savingProduct ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">
              Список товаров
            </h3>
            {loadingData && (
              <p className="text-xs text-neutral-500">Загружаем данные...</p>
            )}
            {dataError && <p className="text-xs text-red-500">{dataError}</p>}
            <div className="max-h-[360px] overflow-auto rounded-2xl border border-black/10 bg-white text-xs">
              <table className="min-w-full border-collapse">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-medium text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Название
                    </th>
                    <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-medium text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Цена
                    </th>
                    <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-medium text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Кол-во
                    </th>
                    <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-medium text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="border-b border-neutral-100 px-2 py-1.5 text-neutral-900">
                        {p.title}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-1.5 text-neutral-900">
                        {Number(p.price).toLocaleString("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-1.5 text-neutral-900">
                        {p.quantity}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-1.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditProduct(p)}
                            className="rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] text-neutral-700 transition hover:bg-neutral-900 hover:text-white"
                          >
                            Изм.
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="rounded-full border border-red-300 px-2 py-0.5 text-[11px] text-red-600 transition hover:bg-red-500 hover:text-white"
                          >
                            Удал.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-2 py-2 text-center text-neutral-500"
                      >
                        Товаров пока нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Requests table */}
        <section className="flex-1 space-y-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Заявки</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Все обращения с лендинга с именем и телефоном.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, телефону или дате"
              className="w-full rounded-2xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10"
            />
            <div className="max-h-[420px] overflow-auto rounded-2xl border border-black/10 bg-white text-xs">
              <table className="min-w-full border-collapse">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-medium text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Имя
                    </th>
                    <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-medium text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Телефон
                    </th>
                    <th className="border-b border-neutral-200 px-2 py-1.5 text-left font-medium text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50">
                      <td className="border-b border-neutral-100 px-2 py-1.5 text-neutral-900">
                        {r.name}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-1.5">
                        <a
                          href={`tel:${r.phone.replace(/\s/g, "")}`}
                          className="text-accent underline-offset-2 hover:underline"
                        >
                          {r.phone}
                        </a>
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-1.5 text-neutral-700">
                        {new Date(r.created_at).toLocaleString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-2 py-2 text-center text-neutral-500"
                      >
                        Заявок пока нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
