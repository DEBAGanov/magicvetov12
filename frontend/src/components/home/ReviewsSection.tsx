/**
 * @file: components/home/ReviewsSection.tsx
 * @description: Customer reviews section
 * @created: 2026-04-15
 */

const reviews = [
  { name: "Анна К.", initial: "А", date: "12 апреля 2026", text: "Заказывала букет на день рождения подруги. Цветы свежие, упаковка красивая. Доставили вовремя!" },
  { name: "Михаил В.", initial: "М", date: "8 апреля 2026", text: "Отличный сервис! Заказал розы жене на годовщину. Букет шикарный, жена в восторге." },
  { name: "Елена С.", initial: "Е", date: "3 апреля 2026", text: "Постоянно заказываю здесь. Всегда свежие, всегда вовремя. Авторские букеты — каждый раз что-то новое!" },
];

export default function ReviewsSection() {
  return (
    <section id="reviews" className="container mx-auto px-4 py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Отзывы наших клиентов</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-500 font-bold flex items-center justify-center text-sm">
                {r.initial}
              </div>
              <div>
                <div className="font-semibold text-sm">{r.name}</div>
                <div className="text-xs text-gray-400">{r.date}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
