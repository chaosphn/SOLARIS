import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptConfirmationDialog } from './receipt-confirmation-dialog';

describe('ReceiptConfirmationDialog', () => {
  let component: ReceiptConfirmationDialog;
  let fixture: ComponentFixture<ReceiptConfirmationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptConfirmationDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptConfirmationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
