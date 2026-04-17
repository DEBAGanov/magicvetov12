/**
 * @file: lib/analytics.ts
 * @description: Yandex Metrika + VK Pixel e-commerce tracking
 */

const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID || "0");
const VK_PIXEL_ID = process.env.NEXT_PUBLIC_VK_PIXEL_ID || "";

declare global {
  interface Window {
    ym: (id: number, method: string, ...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
    _tmr: Record<string, unknown>[];
  }
}

function ymReachGoal(goal: string, data?: unknown) {
  if (!YM_ID || typeof window === "undefined") return;
  try {
    if (typeof window.ym !== "undefined") {
      window.ym(YM_ID, "reachGoal", goal, data);
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: goal, ecommerce: data });
  } catch (e) {
    console.error("YM tracking error:", e);
  }
}

function vkReachGoal(goal: string, value?: number, params?: Record<string, unknown>) {
  if (!VK_PIXEL_ID || typeof window === "undefined") return;
  try {
    if (Array.isArray(window._tmr)) {
      window._tmr.push({
        type: "reachGoal",
        id: VK_PIXEL_ID,
        goal,
        value,
        params: params || {},
      });
    }
  } catch (e) {
    console.error("VK tracking error:", e);
  }
}

export function trackAddToCart(item: {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}) {
  const ecommerceData = {
    add_to_cart: {
      currency: "RUB",
      value: item.price * item.quantity,
      items: [
        {
          item_id: item.productId.toString(),
          item_name: item.name,
          category: item.category || "Цветы",
          quantity: item.quantity,
          price: item.price,
        },
      ],
    },
  };
  ymReachGoal("add_to_cart", ecommerceData);
  vkReachGoal("add_to_cart", item.price * item.quantity, {
    product_id: item.productId.toString(),
  });
}

export function trackViewItem(item: {
  productId: number;
  name: string;
  price: number;
  category?: string;
}) {
  const ecommerceData = {
    view_item: {
      currency: "RUB",
      value: item.price,
      items: [
        {
          item_id: item.productId.toString(),
          item_name: item.name,
          category: item.category || "Цветы",
          quantity: 1,
          price: item.price,
        },
      ],
    },
  };
  ymReachGoal("view_item", ecommerceData);
  vkReachGoal("view_item", item.price, {
    product_id: item.productId.toString(),
  });
}

export function trackBeginCheckout(
  items: { productId: number; name: string; price: number; quantity: number }[],
  totalAmount: number
) {
  const ecommerceData = {
    begin_checkout: {
      value: totalAmount,
      currency: "RUB",
      items: items.map((item) => ({
        item_id: item.productId.toString(),
        item_name: item.name,
        category: "Цветы",
        quantity: item.quantity,
        price: item.price,
      })),
    },
  };
  ymReachGoal("begin_checkout", ecommerceData);

  const productIds = items.map((i) => i.productId.toString());
  vkReachGoal("initiate_checkout", totalAmount, {
    product_id: productIds.length === 1 ? productIds[0] : productIds,
  });
}

export function trackPurchase(
  orderId: number | string,
  totalAmount: number,
  items: { productId: number; name: string; price: number; quantity: number }[]
) {
  const ecommerceData = {
    purchase: {
      transaction_id: orderId.toString(),
      value: totalAmount,
      currency: "RUB",
      items: items.map((item) => ({
        item_id: item.productId.toString(),
        item_name: item.name,
        category: "Цветы",
        quantity: item.quantity,
        price: item.price,
      })),
    },
  };
  ymReachGoal("purchase", ecommerceData);

  const productIds = items.map((i) => i.productId.toString());
  vkReachGoal("purchase", totalAmount, {
    product_id: productIds.length === 1 ? productIds[0] : productIds,
  });
}
