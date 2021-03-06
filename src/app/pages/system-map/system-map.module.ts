import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SystemMapPageRoutingModule } from './system-map-routing.module';

import { SystemMapPage } from './system-map.page';
import { SystemMapListCardComponent } from 'src/app/components/system-map/system-map-list-card/system-map-list-card.component';
import { SystemMapListTagsComponent } from 'src/app/components/system-map/system-map-list-tags/system-map-list-tags.component';
import { SelectAvatarComponent } from 'src/app/components/misc/select-avatar/select-avatar.component';
import { SystemMapListCardComponentModule } from 'src/app/components/system-map/system-map-list-card/system-map-list-card.module';
import { SystemMapListTagsComponentModule } from 'src/app/components/system-map/system-map-list-tags/system-map-list-tags.module';
import { AddUpdateStarObjectComponentModule } from 'src/app/components/system-map/add-update-star-object/add-update-star-object.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SystemMapPageRoutingModule,
    SystemMapListCardComponentModule,
    SystemMapListTagsComponentModule,
    AddUpdateStarObjectComponentModule
  ],
  declarations: [
    SystemMapPage
  ],
})
export class SystemMapPageModule {}
