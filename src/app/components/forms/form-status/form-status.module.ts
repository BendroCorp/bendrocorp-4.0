import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormStatusComponent } from './form-status.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [FormStatusComponent],
  exports: [FormStatusComponent]
})
export class FormStatusComponentModule { }
