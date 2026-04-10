import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptInternalDialog } from './receipt-internal-dialog';

describe('ReceiptInternalDialog', () => {
  let component: ReceiptInternalDialog;
  let fixture: ComponentFixture<ReceiptInternalDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptInternalDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptInternalDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
