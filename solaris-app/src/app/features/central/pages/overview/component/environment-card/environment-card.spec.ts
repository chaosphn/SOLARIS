import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvironmentCard } from './environment-card';

describe('EnvironmentCard', () => {
  let component: EnvironmentCard;
  let fixture: ComponentFixture<EnvironmentCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnvironmentCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnvironmentCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
