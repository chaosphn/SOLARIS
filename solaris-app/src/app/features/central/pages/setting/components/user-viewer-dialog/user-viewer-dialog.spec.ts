import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserViewerDialog } from './user-viewer-dialog';

describe('UserViewerDialog', () => {
  let component: UserViewerDialog;
  let fixture: ComponentFixture<UserViewerDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserViewerDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserViewerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
