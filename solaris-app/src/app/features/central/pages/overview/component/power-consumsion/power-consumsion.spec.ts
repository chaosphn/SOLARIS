import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerConsumsion } from './power-consumsion';

describe('PowerConsumsion', () => {
  let component: PowerConsumsion;
  let fixture: ComponentFixture<PowerConsumsion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PowerConsumsion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PowerConsumsion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
