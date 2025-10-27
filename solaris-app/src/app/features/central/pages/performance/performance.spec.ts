import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Performance } from './performance';

describe('Performance', () => {
  let component: Performance;
  let fixture: ComponentFixture<Performance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Performance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Performance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
