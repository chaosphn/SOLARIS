import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingUpload } from './billing-upload';

describe('BillingUpload', () => {
  let component: BillingUpload;
  let fixture: ComponentFixture<BillingUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
