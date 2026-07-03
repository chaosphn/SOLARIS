import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceCustomerDialog } from './invoice-customer-dialog';

describe('InvoiceCustomerDialog', () => {
  let component: InvoiceCustomerDialog;
  let fixture: ComponentFixture<InvoiceCustomerDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceCustomerDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceCustomerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
