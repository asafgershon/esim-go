export { default } from "./service";

export * from "./service";
export * from "./types";
import * as payment from "./service";
export type PaymentServiceInstance = typeof payment;
export { payment as paymentService };