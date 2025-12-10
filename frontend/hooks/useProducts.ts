"use client";

import { API_URL } from "@/config";
import { useEffect, useMemo, useState } from "react";

export type Product = {
  id: string;
  title: string;
  price: string;
  quantity: number;
  description?: string | null;
  image?: string | null;
};

const PAGE_SIZE = 8;

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) {
          throw new Error("Не удалось загрузить товары");
        }
        const data = (await res.json()) as Product[];
        setProducts(data);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Ошибка при загрузке товаров"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(products.length / PAGE_SIZE)),
    [products.length]
  );

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [page, products]);

  return {
    products,
    loading,
    error,
    page,
    setPage,
    PAGE_SIZE,
    totalPages,
    paginatedProducts,
  };
}
