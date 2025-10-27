import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherStation } from './weather-station';

describe('WeatherStation', () => {
  let component: WeatherStation;
  let fixture: ComponentFixture<WeatherStation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WeatherStation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeatherStation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
