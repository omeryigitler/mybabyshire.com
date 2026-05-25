import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import {
  sendOrderDeliveredEmail,
  sendOrderShippedEmail,
} from "../../_lib/email.js";
import {
  SHIPMENT_STATUS_OPTIONS,
  buildManualTimeline,
  getCarrierDisplayName,
  getCarrierTrackingUrl,
  getShipmentStatusLabel,
  mapOrderStatusToShipmentStatus,
  normalizeCarrierKey,
  validateTrackingNumber,
} from "../../../src/utils/carriers.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-development";

const requireAdmin = (authorization?: string) => {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing token");
  }

  const token = authorization.split(" ")[1];
  return jwt.verify(token, JWT_SECRET);
};

const allowedOrderStatuses = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const allowedPaymentStatuses = ["pending", "paid", "refunded"];
const allowedShipmentStatuses = SHIPMENT_STATUS_OPTIONS.map(
  (option) => option.value,
);

const parseJson = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getPaymentProvider = (
  paymentReference?: string | null,
  snapshot?: any,
) => {
  if (snapshot?.provider === "paypal") return "PayPal";
  if (snapshot?.provider === "stripe") return "Stripe";
  if (
    paymentReference?.startsWith("cs_") ||
    paymentReference?.startsWith("pi_")
  )
    return "Stripe";
  if (paymentReference) return "PayPal";
  return "Not selected";
};

const buildEmailPayload = (order: any) => {
  const snapshot = parseJson(order.personalization_data_json);
  return {
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    total: Number(order.total_amount) || 0,
    paymentProvider: getPaymentProvider(order.payment_reference, snapshot),
    trackingReference: order.tracking_reference,
    items:
      order.items?.map((item: any) => ({
        productName: item.product_name_snapshot,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price_snapshot) || 0,
      })) || [],
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req.headers.authorization);
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = String(req.query.id || "");

  if (!id) {
    return res.status(400).json({ error: "Missing order id." });
  }

  try {
    const {
      orderStatus,
      paymentStatus,
      trackingReference,
      carrier,
      shipmentStatus,
      estimatedDelivery,
      trackingUrl,
    } = req.body;

    if (orderStatus && !allowedOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({ error: "Invalid order status." });
    }

    if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid payment status." });
    }

    if (shipmentStatus && !allowedShipmentStatuses.includes(shipmentStatus)) {
      return res.status(400).json({ error: "Invalid shipment status." });
    }

    const previousOrder = await prisma.orders.findUnique({ where: { id } });

    if (!previousOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    const previousSnapshot =
      parseJson(previousOrder.personalization_data_json) || {};
    const nextOrderStatus = orderStatus || previousOrder.order_status;
    const nextPaymentStatus = paymentStatus || previousOrder.payment_status;
    const nextTrackingReference =
      String(trackingReference || "").trim() || null;
    const nextCarrier = String(
      carrier ||
        previousSnapshot.carrier ||
        previousSnapshot.shippingMethod?.carrier ||
        "USPS",
    ).trim();
    const nextShipmentStatus =
      shipmentStatus ||
      previousSnapshot.shipmentStatus ||
      mapOrderStatusToShipmentStatus(nextOrderStatus, nextPaymentStatus);
    const trackingValidation = validateTrackingNumber(
      nextCarrier,
      nextTrackingReference,
    );

    if (!trackingValidation.valid) {
      return res.status(400).json({ error: trackingValidation.message });
    }

    if (
      ["shipped", "in_transit", "out_for_delivery"].includes(
        nextShipmentStatus,
      ) &&
      !nextTrackingReference
    ) {
      return res.status(400).json({
        error: "Add a tracking reference before marking this shipment as moving.",
      });
    }

    const nextEstimatedDelivery =
      String(estimatedDelivery || "").trim() ||
      previousSnapshot.estimatedDelivery ||
      previousSnapshot.shippingMethod?.estimatedDelivery ||
      null;
    const nextTrackingUrl =
      String(trackingUrl || "").trim() ||
      getCarrierTrackingUrl(nextCarrier, nextTrackingReference) ||
      null;
    const timelineSeed = Array.isArray(previousSnapshot.trackingEvents)
      ? previousSnapshot.trackingEvents
      : buildManualTimeline({
          orderNumber: previousOrder.order_number,
          paymentStatus: nextPaymentStatus,
          orderStatus: nextOrderStatus,
          createdAt: previousOrder.created_at,
          trackingNumber: nextTrackingReference,
          carrier: nextCarrier,
        });
    const shipmentChanged =
      previousSnapshot.shipmentStatus !== nextShipmentStatus ||
      previousSnapshot.carrier !== nextCarrier ||
      previousOrder.tracking_reference !== nextTrackingReference;
    const trackingEvents = shipmentChanged
      ? [
          {
            status: nextShipmentStatus,
            description: `${getCarrierDisplayName(nextCarrier)} shipment details were updated by Little Wonders.`,
            timestamp: new Date().toISOString(),
          },
          ...timelineSeed,
        ]
      : timelineSeed;
    const nextSnapshot = {
      ...previousSnapshot,
      carrier: nextCarrier,
      carrierKey: normalizeCarrierKey(nextCarrier),
      trackingNumber: nextTrackingReference,
      shipmentStatus: nextShipmentStatus,
      shipmentStatusLabel: getShipmentStatusLabel(nextShipmentStatus),
      estimatedDelivery: nextEstimatedDelivery,
      trackingUrl: nextTrackingUrl,
      trackingEvents,
      lastShipmentUpdate: new Date().toISOString(),
    };

    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: {
        order_status: nextOrderStatus,
        payment_status: nextPaymentStatus,
        tracking_reference: nextTrackingReference,
        personalization_data_json: JSON.stringify(nextSnapshot),
      },
      include: { items: true },
    });

    if (previousOrder?.order_status !== updatedOrder.order_status) {
      const emailPayload = buildEmailPayload(updatedOrder);
      if (updatedOrder.order_status === "shipped")
        await sendOrderShippedEmail(emailPayload);
      if (updatedOrder.order_status === "delivered")
        await sendOrderDeliveredEmail(emailPayload);
    }

    return res.status(200).json({
      id: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
      orderStatus: updatedOrder.order_status,
      paymentStatus: updatedOrder.payment_status,
      trackingReference: updatedOrder.tracking_reference,
      trackingNumber: updatedOrder.tracking_reference,
      carrier: getCarrierDisplayName(nextCarrier),
      carrierKey: normalizeCarrierKey(nextCarrier),
      shipmentStatus: nextShipmentStatus,
      shipmentStatusLabel: getShipmentStatusLabel(nextShipmentStatus),
      estimatedDelivery: nextEstimatedDelivery,
      trackingUrl: nextTrackingUrl,
    });
  } catch (error) {
    return res.status(400).json({
      error: "Failed to update order",
      details: (error as Error).message,
    });
  }
}
