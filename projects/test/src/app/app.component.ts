import { Component } from '@angular/core';
import { ActyxPondService } from '../../../../dist/ng-pond'
import { MachineFish, State } from '../fish/MachineFish';
import { Observable } from 'rxjs';
import { ConnectivityStatus } from '@actyx/pond';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  machine$: Observable<State>
  connectivity$: Observable<ConnectivityStatus>

  constructor(private pondService: ActyxPondService) {
    this.machine$ = pondService.observe$(MachineFish.of('Machine1'))
    this.connectivity$ = pondService.getNodeConnectivity$()
  }

  async start() {
    const pond = await this.pondService.getPond()
    MachineFish.emitProdStartedEvent(pond, 'Machine1', 'order1')
  }

  async stop() {
    const pond = await this.pondService.getPond()
    MachineFish.emitProdStoppedEvent(pond, 'Machine1', 'order1')
  }
}
