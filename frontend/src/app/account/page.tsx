/**
 * @file: app/account/page.tsx
 * @description: User profile page (auth required)
 * @created: 2026-04-15
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth-store";

export default function AccountPage() {
  const { isAuthenticated, user, logout, restoreSession } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    restoreSession();
    setMounted(true);
  }, []);

  if (!mounted) return <div className="container mx-auto px-4 py-16 text-center text-gray-400">Загрузка...</div>;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-xl font-bold mb-2">Войдите в аккаунт</h2>
        <p className="text-gray-400 mb-6">Для доступа к личному кабинету</p>
        <Link href="/account/login" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Личный кабинет</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
        <div className="text-sm text-gray-500">Имя</div>
        <div className="font-semibold">{user?.displayName || user?.username}</div>
        {user?.email && <><div className="text-sm text-gray-500">Email</div><div className="font-semibold">{user.email}</div></>}
        {user?.phone && <><div className="text-sm text-gray-500">Телефон</div><div className="font-semibold">{user.phone}</div></>}
      </div>
      <div className="mt-4 space-y-2">
        <Link href="/account/orders" className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 font-medium">
          Мои заказы &rarr;
        </Link>
        <button onClick={logout} className="w-full p-4 text-red-500 bg-white rounded-xl border border-gray-100 hover:border-red-200 font-medium">
          Выйти
        </button>
      </div>
    </div>
  );
}
