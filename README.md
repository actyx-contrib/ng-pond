<img width="130px" src="https://raw.githubusercontent.com/actyx-contrib/ng-pond/master/icon.png?token=AATHWQIC5RWS62GY3OINH3C645MHQ">

# ng-Pond
Use the Actyx Pond framework integrated as service in your angular application. Expand your toolchain with the ActyxPondService to observe fish al over your application and speed up your UI projects and write distributed apps in a couple of hours.

## 📦 Installation
ng-pond is available as a npm package.

npm install @actyx-contrib/ng-pond

## 📖 Documentation and detailed examples
You can access the full API documentation and related examples by visiting: https://actyx-contrib.github.io/react-pond

You will find detailed examples here. They can be executed running e.g. `npm run example:chatRoom'.

## 🤓 Quick start

### 🌊 ActyxPondService

Add the `ActyxPondService` to your root module as singleton instance to keep the advantage of the pond internal fish caching  .

#### 📖 Example:

```typescript
import { AppComponent } from './app.component';
import { ActyxPondService } from '@actyx-contrib/ng-pond'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [ActyxPondService],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### 🐟 Use the pond api

Use the simple pond api in your components as with callbacks or with rxjs observables. This will give you the opportunity to modify your fish states in the code or use `async` pipelines to build reactive and simple user interfaces.

#### 📖 Example:

##### Logic:

```typescript
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

  constructor(private pondService: ActyxPondService) {}

  ngOnInit() {
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
```

##### Template:

```html
<h1>Angular - Actyx-Pond - Machine control</h1>
<div *ngIf="connectivity$ | async as connectivity">
  <h2>Connectivity: {{connectivity.status | json}}</h2>
</div>
<div *ngIf="machine$ | async as machine; else loading">
  <button *ngIf="machine.type==='stopped'" (click)="start()">start</button>
  <button *ngIf="machine.type==='started'" (click)="stop()">stop</button>
  <div>
    <h2>Machine {{machine.machineId}}</h2>
    <dl>
      <dt>state:</dt>
      <dd>{{machine.state}}</dd>
    </dl>
  </div>
</div>
<ng-template #loading>Loading machine data...</ng-template>
```
