import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tabular } from './tabular';

describe('Tabular', () => {
  let component: Tabular;
  let fixture: ComponentFixture<Tabular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tabular]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tabular);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
