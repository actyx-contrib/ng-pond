import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ActyxPondService } from '../../../../dist/ng-pond'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [ActyxPondService],
  bootstrap: [AppComponent]
})
export class AppModule {}
