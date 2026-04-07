import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentUpload } from './payment-upload';

describe('PaymentUpload', () => {
  let component: PaymentUpload;
  let fixture: ComponentFixture<PaymentUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
