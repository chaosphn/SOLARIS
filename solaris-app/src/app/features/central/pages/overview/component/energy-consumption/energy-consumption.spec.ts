import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnergyConsumption } from './energy-consumption';

describe('EnergyConsumption', () => {
  let component: EnergyConsumption;
  let fixture: ComponentFixture<EnergyConsumption>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnergyConsumption]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnergyConsumption);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
