import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ActyxPondService } from '../../../../dist/ng-pond'
import { MachineService } from './machine.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [ActyxPondService, MachineService],
  bootstrap: [AppComponent]
})
export class AppModule {}
