export class InvoiceDto {
  id: string;
  customerId: string;
  establishmentId: string;
  stripeInvoiceId: string;
  subscriptionId: string | null;
  amountPaid: number;
  status: string;
  createdAt: Date;
}

export class ListInvoicesResponseDto {
  invoices: InvoiceDto[];
  total: number;
}
