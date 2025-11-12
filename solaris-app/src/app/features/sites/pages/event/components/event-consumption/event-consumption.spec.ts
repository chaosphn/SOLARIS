import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventConsumption } from './event-consumption';

describe('EventConsumption', () => {
  let component: EventConsumption;
  let fixture: ComponentFixture<EventConsumption>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventConsumption]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventConsumption);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
