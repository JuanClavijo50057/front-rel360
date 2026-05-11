import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutritionLabelComponent } from './nutrition-label.component';

describe('NutritionLabelComponent', () => {
  let component: NutritionLabelComponent;
  let fixture: ComponentFixture<NutritionLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutritionLabelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutritionLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
