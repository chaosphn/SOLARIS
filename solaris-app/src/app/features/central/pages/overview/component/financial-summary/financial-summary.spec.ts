import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialSummary } from './financial-summary';

describe('FinancialSummary', () => {
  let component: FinancialSummary;
  let fixture: ComponentFixture<FinancialSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
