import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlarmConfig } from './alarm-config';

describe('AlarmConfig', () => {
  let component: AlarmConfig;
  let fixture: ComponentFixture<AlarmConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlarmConfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlarmConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
