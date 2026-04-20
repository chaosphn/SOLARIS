import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Events2 } from './events';
import { Events2Module } from './events-module';

describe('Events2', () => {
  let component: Events2;
  let fixture: ComponentFixture<Events2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Events2Module]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Events2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
