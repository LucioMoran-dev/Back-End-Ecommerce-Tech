import { OrderStatus } from '../../orders/enum/order.enum';

export interface ICreateRefund {
  orderId: string;
  reason: string;
  description: string;
}

export interface IAdminRefundAction {
  adminResponse: string;
}

export const REFUNDABLE_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];
