import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerConsumption } from './power-consumption';

describe('PowerConsumption', () => {
  let component: PowerConsumption;
  let fixture: ComponentFixture<PowerConsumption>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PowerConsumption]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PowerConsumption);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
