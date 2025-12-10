"use client";

import { API_URL } from "@/config";
import { useState } from "react";

type RequestPayload = {
  name: string;
  phone: string;
};

export function formatPhoneMask(raw: string): string {
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

export function useRequestForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const phoneDisplay = formatPhoneMask(phoneRaw);

  const resetState = () => {
    setError(null);
    setSuccess(null);
  };

  const open = () => {
    resetState();
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    resetState();
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

    const payload: RequestPayload = {
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

  return {
    isOpen,
    open,
    close,
    name,
    setName,
    phoneRaw,
    setPhoneRaw,
    phoneDisplay,
    submitting,
    error,
    success,
    handleSubmit,
  };
}
