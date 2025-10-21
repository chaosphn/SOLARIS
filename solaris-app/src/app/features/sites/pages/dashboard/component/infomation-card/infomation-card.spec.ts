import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfomationCard } from './infomation-card';

describe('InfomationCard', () => {
  let component: InfomationCard;
  let fixture: ComponentFixture<InfomationCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfomationCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfomationCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
