import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceAccountingDialog } from './invoice-accounting-dialog';

describe('InvoiceAccountingDialog', () => {
  let component: InvoiceAccountingDialog;
  let fixture: ComponentFixture<InvoiceAccountingDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceAccountingDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceAccountingDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
