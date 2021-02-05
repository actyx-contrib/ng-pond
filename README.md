<img width="130px" src="https://raw.githubusercontent.com/actyx-contrib/ng-pond/master/icon.png?token=AATHWQO47MDKOSROJRW3VYDADVZEW">

# ng-Pond

Use the Actyx Pond framework integrated as service in your angular application. Expand your toolchain with the `ActyxPondService` to observe fish all over your application and speed up your UI projects and write distributed apps in a couple of hours.

## 📦 Installation

ng-pond is available as a npm package.

`npm install @actyx-contrib/ng-pond`

## 🤓  Quick start

### 🌊 ActyxPondService

Add the `ActyxPondService` to your root module as singleton instance and keep the advantage of the pond's internal caching.

#### 📖 Example:

File: `app.module.ts`

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

Use the simple pond api in your components as with callbacks or with rxjs observables. This will give you the opportunity to use your fish states in the code or use `async` pipelines to build reactive and state of the art user interfaces.

> **Note**: It is highly recommended to build applications in  *separation of concerns* [(SoC)](https://en.wikipedia.org/wiki/Separation_of_concerns). Using the `PondService` directly in the components makes it harder to maintain your project and write e2e and unit tests for your components.

#### 📖 Example:

##### Logic:

File: `app.component.ts`

```typescript
import { Component } from '@angular/core';
import { ActyxPondService } from '@actyx-contrib/ng-pond'
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
    this.machine$ = this.pondService.observe$(MachineFish.of('Machine1'))
    this.connectivity$ = this.pondService.getNodeConnectivity$()
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

File: `app.component.html`

```html
<h1>Angular - Actyx-Pond - Machine control</h1>
<div *ngIf="connectivity$ | async as connectivity">
  <h2>Connectivity: {{connectivity.status | json}}</h2>
</div>
<div *ngIf="machine$ | async as machine; else loading">
  <div>
    <h2>Machine {{machine.machineId}}</h2>
    <dl>
      <dt>state:</dt>
      <dd>{{machine.state}}</dd>
    </dl>
  </div>
  <button *ngIf="machine.state==='stopped'" (click)="start()">start</button>
  <button *ngIf="machine.state==='started'" (click)="stop()">stop</button>
</div>
<ng-template #loading>Loading machine data...</ng-template>
```

##### 🐟 Fish

File: `MachineFish.ts`

```typescript
import { Fish, FishId, Pond, Tag } from '@actyx/pond'
export type State =
  | { state: 'idle', machineId: string }
  | { state: 'inProduction', machineId: string, orderId: string }
export type Event =
  | { eventType: 'prodStarted', machineId: string, orderId: string }
  | { eventType: 'prodStopped', machineId: string, orderId: string }

const machineTag = Tag<Event>('machine')

export const MachineFish = {
  tags: { machineTag },
  of: (machineId: string): Fish<State, Event> => ({
    fishId: FishId.of('machineFish', machineId, 0),
    initialState: { state: 'idle', machineId },
    where: machineTag.withId(machineId),
    onEvent: (state, event) => {
      switch (event.eventType) {
        case 'prodStarted':
          return {
            state: 'inProduction',
            machineId: state.machineId,
            orderId: event.orderId,
          }
        case 'prodStopped':
          return {
            state: 'idle',
            machineId: state.machineId,
          }
      }
      return state
    },
  }),
  emitProdStoppedEvent: (pond: Pond, machineId: string, orderId: string) =>
    pond.emit(
      machineTag.withId(machineId),
      { eventType: 'prodStopped', machineId, orderId }
    ),
  emitProdStartedEvent: (pond: Pond, machineId: string, orderId: string) =>
    pond.emit(
      machineTag.withId(machineId),
      { eventType: 'prodStarted', machineId, orderId }
    ),
}

```

### Registry fish

In the pond, there are two ways to create registry fish. `observeAll` and `observe` a registry fish and map the entity fish as a second step. In the matter that `observeAll` is pretty strate forward, here is an example for the registry fish.

#### 📖 Example:

> **Note**: This example is build on top of the `Use the pond api` example above.

##### Logic:

File: `app.component.ts`

```typescript
// [..]
  allMachines$: Observable<ReadonlyArray<State>>

  constructor(private pondService: ActyxPondService) {
    this.machine$ = this.pondService.observe$(MachineFish.of('Machine1'))
    this.allMachine$ = this.pondService.observeRegistry$(MachineFish.registry(), s => s, MachineFish.of)
    this.connectivity$ = this.pondService.getNodeConnectivity$()
  }
// [..]
}
```

##### Template:

File: `app.component.html`

```html
<!-- [..] -->
<div *ngFor="let machine of (allMachines$ | async)">
  <dl>
    <dt>Name:</dt>
    <dd>{{machine.machineId}}</dd>
    <dt>State:</dt>
    <dd>{{machine.state}}</dd>
  </dl>
</div>
<!-- [..] -->
```

##### 🐟 Fish

File: `MachineFish.ts`

```typescript
export const MachineFish = {
  // [..]
  registry: (): Fish<string[], Event> => ({
    fishId: FishId.of('machineRegFish', 'reg', 0),
    initialState: [],
    where: machineTag,
    onEvent: (state, event) => {
      if (!state.includes(event.machineId)) {
        state.push(event.machineId)
      }
      return state
    },
  }),
  // [..]
```


## 📖 Service overview

> Check out the documentation about the Actyx-Pond to get more detailed information https://developer.actyx.com/docs/pond/introduction/

You are going to find a detailed api documentation in the definition file of the package.

### TS/JS Promise interface:

 - getPond()
 - emit(tags, event)
 - observe(fish, onStateChanged)
 - observeRegistry(registryFish, mapToProperty, makeEntityFish, onStateChanged)
 - observeAll(seedEventsSelector, makeFish, opts, onStateChanged)
 - observeOne(seedEventSelector, makeFish, onStateChanged, stoppedByError)
 - getPondState(callback)
 - pondInfo()
 - run(fish, fn)
 - keepRunning(fish, fn, autoCancel)

### RxJs integration:

> **Note**: _Not every function has a RxJs wrapper. In this case, please use the one from above._

 - getRxPond()
 - observeRegistry$(registryFish, mapToProperty, makeEntityFish)
 - observe$(fish)
 - observeAll$(seedEventsSelector, makeFish, opts)
 - observeOne$(seedEventsSelector, makeFish)
 - getPondState$()
 - getNodeConnectivity$()
 - waitForSwarmSync$()
 - run$(fish, fn)
