import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationInternalDialog } from './confirmation-internal-dialog';

describe('ConfirmationInternalDialog', () => {
  let component: ConfirmationInternalDialog;
  let fixture: ComponentFixture<ConfirmationInternalDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationInternalDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmationInternalDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
