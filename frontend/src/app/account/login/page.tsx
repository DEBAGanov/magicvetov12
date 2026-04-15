/**
 * @file: app/account/login/page.tsx
 * @description: Login/Register/SMS auth page
 * @created: 2026-04-15
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { authApi } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, smsLogin } = useAuthStore();
  const [tab, setTab] = useState<"login" | "register" | "sms">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register form
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");

  // SMS form
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError("");
    try { await login(username, password); router.push("/account"); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Ошибка входа"); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setLoading(true); setError("");
    try { await register({ username: regUsername, email: regEmail, password: regPassword, firstName: regFirstName }); router.push("/account"); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Ошибка регистрации"); }
    finally { setLoading(false); }
  };

  const handleSendSms = async () => {
    setLoading(true); setError("");
    try { await authApi.sendSmsCode({ phoneNumber: phone }); setSmsSent(true); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Ошибка отправки кода"); }
    finally { setLoading(false); }
  };

  const handleVerifySms = async () => {
    setLoading(true); setError("");
    try { await smsLogin(phone, code); router.push("/account"); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Неверный код"); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary-500 outline-none";

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6">Вход в аккаунт</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {(["login", "register", "sms"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white shadow text-primary-500" : "text-gray-500"}`}>
            {t === "login" ? "Вход" : t === "register" ? "Регистрация" : "SMS"}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

      {/* Login */}
      {tab === "login" && (
        <div className="space-y-3">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Имя пользователя" className={inputCls} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className={inputCls} />
          <button onClick={handleLogin} disabled={loading || !username || !password} className="w-full py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 disabled:opacity-50">
            {loading ? "Входим..." : "Войти"}
          </button>
        </div>
      )}

      {/* Register */}
      {tab === "register" && (
        <div className="space-y-3">
          <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="Имя пользователя" className={inputCls} />
          <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Email" className={inputCls} />
          <input type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} placeholder="Имя" className={inputCls} />
          <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Пароль" className={inputCls} />
          <button onClick={handleRegister} disabled={loading || !regUsername || !regPassword} className="w-full py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 disabled:opacity-50">
            {loading ? "Регистрируем..." : "Зарегистрироваться"}
          </button>
        </div>
      )}

      {/* SMS */}
      {tab === "sms" && !smsSent && (
        <div className="space-y-3">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" className={inputCls} />
          <button onClick={handleSendSms} disabled={loading || phone.length < 10} className="w-full py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 disabled:opacity-50">
            {loading ? "Отправляем..." : "Отправить код"}
          </button>
        </div>
      )}
      {tab === "sms" && smsSent && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 text-center">Код отправлен на {phone}</p>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Код из SMS" maxLength={4} className={inputCls} />
          <button onClick={handleVerifySms} disabled={loading || code.length < 4} className="w-full py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 disabled:opacity-50">
            {loading ? "Проверяем..." : "Подтвердить"}
          </button>
        </div>
      )}
    </div>
  );
}
