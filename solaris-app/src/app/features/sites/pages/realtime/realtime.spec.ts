import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Realtime } from './realtime';

describe('Realtime', () => {
  let component: Realtime;
  let fixture: ComponentFixture<Realtime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Realtime]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Realtime);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
