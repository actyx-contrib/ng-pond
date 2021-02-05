import { Injectable } from '@angular/core';
import { ActyxPondService } from 'projects/ng-pond/src/public-api';
import { MachineFish, State } from '../fish/MachineFish';

export type MachineState = State
@Injectable({providedIn: 'root'})
export class MachineService {
  constructor(private pondService: ActyxPondService) {}

  observeMachine( machine: string ) {
    return this.pondService.observe$(MachineFish.of(machine))
  }

  getAllMachines() {
    return this.pondService.observeRegistry$(
      MachineFish.registry(),
      Object.keys,
      MachineFish.of
    )
  }

  async start(machine:string, order: string) {
    MachineFish.emitProdStartedEvent(
      await this.pondService.getPond(),
      machine,
      order
    )
  }

  async stop(machine:string, order: string) {
    MachineFish.emitProdStoppedEvent(
      await this.pondService.getPond(),
      machine,
      order
    )
  }
}
