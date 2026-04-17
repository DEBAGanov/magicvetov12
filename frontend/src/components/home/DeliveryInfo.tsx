/**
 * @file: components/home/DeliveryInfo.tsx
 * @description: Delivery advantages section
 * @created: 2026-04-15
 */

export default function DeliveryInfo() {
  const items = [
    { icon: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z", title: "Доставка 2 часа", desc: "Бережная доставка по городу" },
    { icon: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z", title: "Гарантия свежести", desc: "Только свежие цветы" },
    { icon: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z", title: "Удобная оплата", desc: "Карта, СБП, наличные" },
    { icon: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z", title: "Открыта бесплатно", desc: "К каждому заказу" },
  ];

  return (
    <section id="delivery" className="container mx-auto px-4 py-10 border-b border-gray-100">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <div key={i} className="text-center p-4">
            <div className="w-14 h-14 mx-auto mb-3 bg-primary-50 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-primary-500"><path d={item.icon} /></svg>
            </div>
            <div className="font-semibold text-sm">{item.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-xl overflow-hidden">
        <iframe
          src="https://yandex.ru/map-widget/v1/?z=15&ol=biz&oid=174166621256"
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen
          title="Магия Цветов на карте"
        />
      </div>
    </section>
  );
}
