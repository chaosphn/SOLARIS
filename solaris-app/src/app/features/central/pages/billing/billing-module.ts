import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BillingRoutingModule } from './billing-routing-module';
import { Billing } from './billing';
import { ShareModule } from '../../../../shared/shared.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ConfirmationInternalDialog } from './components/confirmation-internal-dialog/confirmation-internal-dialog';
import { FormsModule } from '@angular/forms';
import { ConfirmationCustomerDialog } from './components/confirmation-customer-dialog/confirmation-customer-dialog';
import { InvoiceAccountingDialog } from './components/invoice-accounting-dialog/invoice-accounting-dialog';
import { PaymentConfirmationDialog } from './components/payment-confirmation-dialog/payment-confirmation-dialog';
import { ReceiptConfirmationDialog } from './components/receipt-confirmation-dialog/receipt-confirmation-dialog';
import { ReceiptInternalDialog } from './components/receipt-internal-dialog/receipt-internal-dialog';
import { BillingViewerDialog } from './components/billing-viewer-dialog/billing-viewer-dialog';
import { BillingEditorDialog } from './components/billing-editor-dialog/billing-editor-dialog';

@NgModule({
  declarations: [
    Billing,
    ConfirmationInternalDialog,
    ConfirmationCustomerDialog,
    InvoiceAccountingDialog,
    PaymentConfirmationDialog,
    ReceiptConfirmationDialog,
    ReceiptInternalDialog,
    BillingViewerDialog,
    BillingEditorDialog
  ],
  imports: [
    CommonModule,
    FormsModule,
    ShareModule,
    PdfViewerModule,
    BillingRoutingModule
  ]
})
export class BillingModule { }

