import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceSummary } from './performance-summary';

describe('PerformanceSummary', () => {
  let component: PerformanceSummary;
  let fixture: ComponentFixture<PerformanceSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PerformanceSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerformanceSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
