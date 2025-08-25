export { default } from "./easycard.service";

export * from "./easycard.service";
export * from "./types";
import * as easycard from "./easycard.service";
export type PaymentServiceInstance = typeof easycard;
export { easycard as paymentService };