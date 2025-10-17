import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircleProgress } from './circle-progress';

describe('CircleProgress', () => {
  let component: CircleProgress;
  let fixture: ComponentFixture<CircleProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircleProgress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircleProgress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
