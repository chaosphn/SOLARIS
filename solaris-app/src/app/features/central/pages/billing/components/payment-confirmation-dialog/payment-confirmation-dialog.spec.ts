import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentConfirmationDialog } from './payment-confirmation-dialog';

describe('PaymentConfirmationDialog', () => {
  let component: PaymentConfirmationDialog;
  let fixture: ComponentFixture<PaymentConfirmationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentConfirmationDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentConfirmationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
