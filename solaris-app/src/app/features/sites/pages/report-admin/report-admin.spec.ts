import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportAdmin } from './report-admin';

describe('ReportAdmin', () => {
  let component: ReportAdmin;
  let fixture: ComponentFixture<ReportAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
