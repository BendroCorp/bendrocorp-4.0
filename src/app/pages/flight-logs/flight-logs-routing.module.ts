import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FlightLogsPage } from './flight-logs.page';

const routes: Routes = [
  {
    path: '',
    component: FlightLogsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FlightLogsPageRoutingModule {}