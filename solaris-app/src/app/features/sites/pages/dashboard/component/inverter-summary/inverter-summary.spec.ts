import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InverterSummary } from './inverter-summary';

describe('InverterSummary', () => {
  let component: InverterSummary;
  let fixture: ComponentFixture<InverterSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InverterSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InverterSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
