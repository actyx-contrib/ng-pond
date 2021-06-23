import { Component } from '@angular/core';
import { ActyxPondService } from '../../../../dist/ng-pond'
import { Observable } from 'rxjs';
import { MachineService, MachineState } from './machine.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  machine$: Observable<MachineState>
  allMachines$: Observable<ReadonlyArray<MachineState>>

  constructor(pondService: ActyxPondService, private machine: MachineService) {
    this.machine$ = machine.observeMachine('Machine1')
    this.allMachines$ = machine.getAllMachines()
  }
  async start() {
    this.machine.start('Machine1', 'order1')
  }
  async stop() {
    this.machine.stop('Machine1', 'order1')
  }
}
