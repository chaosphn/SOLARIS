import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapConsumption } from './map-consumption';

describe('MapConsumption', () => {
  let component: MapConsumption;
  let fixture: ComponentFixture<MapConsumption>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapConsumption]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapConsumption);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
