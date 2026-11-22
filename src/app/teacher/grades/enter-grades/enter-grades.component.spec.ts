import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnterGradesComponent } from './enter-grades.component';

describe('EnterGradesComponent', () => {
  let component: EnterGradesComponent;
  let fixture: ComponentFixture<EnterGradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnterGradesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EnterGradesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
