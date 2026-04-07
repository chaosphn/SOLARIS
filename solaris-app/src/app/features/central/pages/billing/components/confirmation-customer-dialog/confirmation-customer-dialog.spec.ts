import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationCustomerDialog } from './confirmation-customer-dialog';

describe('ConfirmationCustomerDialog', () => {
  let component: ConfirmationCustomerDialog;
  let fixture: ComponentFixture<ConfirmationCustomerDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationCustomerDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmationCustomerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
