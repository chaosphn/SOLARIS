import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationConfig } from './notification-config';

describe('NotificationConfig', () => {
  let component: NotificationConfig;
  let fixture: ComponentFixture<NotificationConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationConfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
