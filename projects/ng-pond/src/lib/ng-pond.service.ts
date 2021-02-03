import { Injectable } from '@angular/core';
import { CancelSubscription, Fish, ObserveAllOpts, PendingEmission, Pond, PondInfo, PondState, StateEffect, Tags, Where } from '@actyx/pond'
import { RxPond } from '@actyx-contrib/rx-pond'
import { combineLatest, from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ActyxPondService {
  pond: Pond | undefined
  rxPond: RxPond | undefined
  constructor() {
    const sv = this
    Pond.default().then(pond => {
      sv.pond = pond
      sv.rxPond = RxPond.from(pond)
    })
  }

  /**
   * @returns A Promise of a returns the native pond instance to work with the bare api
   */
  getPond(): Promise<Pond> {
    const sv = this
    return new Promise(res => {
      if (sv.pond) {
        res(sv.pond)
      }

      const interval = setInterval(() => {
        if (sv.pond) {
          clearInterval(interval)
          res(sv.pond)
        }
      }, 50)
    })
  }
  /**
   * @returns A Promise of a the Rx-pond instance to work with the bare api
   */
  getRxPond(): Promise<RxPond> {
    const sv = this
    return new Promise(res => {
      if (sv.rxPond) {
        res(sv.rxPond)
      }

      const interval = setInterval(() => {
        if (sv.rxPond) {
          clearInterval(interval)
          res(sv.rxPond)
        }
      }, 50)
    })
  }

  /**
   * Emit a single event directly.
   *
   * @typeParam E  - Type of the event payload. If your tags are statically declared,
   *                 their type will be checked against the payload’s type.
   *
   * @param tags   - Tags to attach to the event. E.g. `Tags('myTag', 'myOtherTag')`
   * @param event  - The event itself.
   * @returns        A Promise of a `PendingEmission` object that can be used to register
   *                 callbacks with the emission’s completion.
   */
  async emit<E>(tags: Tags<E>, event: E): Promise<PendingEmission> {
    return (await this.getPond()).emit(tags, event)
  }
  /**
   * Observe the current state of a Fish.
   *
   * Caching is done based on the `fishId` inside the `fish`, i.e. if a fish with the included
   * `fishId` is already known, that other Fish’s ongoing aggregation will be used instead of
   * starting a new one.
   *
   * @param fish       - Complete Fish information.
   * @param callback   - Function that will be called whenever a new state becomes available.
   * @param stoppedByError - Function that will be called when one of the Fish’s functions throws an error.
   *                         A Fish will always stop emitting further states after errors, even if no `stoppedByError` argument is passed.
   * @returns            A Promise of a function that can be called in order to cancel the subscription.
   */
  observe<S,E>(fish: Fish<S,E>, onStateChanged: (state: S) => void): Promise<CancelSubscription>  {
    return this.getPond().then(pond => pond.observe(fish, onStateChanged))
  }
  /**
   * Use your complex registry fish to get the state of the required entities.
   *
   * @typeParam RegS       - Type of the observed registry Fish’s state.
   * @typeParam P          - Type of the properties used to initialize Fish.
   * @typeParam S          - Type of the observed Fish’s state.
   *
   * @param registryFish   - A `Fish<any, RegS>` to observe to get a list of the entities to observe
   * @param mapToProperty  - Map the state of the registry fish to an array of entity fish properties.
   * @param makeEntityFish - Factory function to create a Fish with state `S` from an property of type `P`.
   *                         `undefined` may be returned to indicate the given value should not be converted to a Fish at all.
   *
   * @returns              An Observable of the last updated state of each entity fish.
   *                       Each published state will be stricter newer than the last one.
   *                       (the last array of states is buffered and immediately supplied to new subscribers.)
   */
  observeRegistry$<RegS, P, S>(
    registryFish: Fish<any, RegS>,
    mapToProperty: (regState: RegS) => ReadonlyArray<P | undefined>,
    makeEntityFish: (seedEvent: P) => Fish<S, any>,
  ): Observable<S[]> {
    return from(this.getRxPond()).pipe(
      switchMap(pond => pond.observe(registryFish)
        .pipe(
          map(mapToProperty),
          map((props): ReadonlyArray<P> => props.filter((p): p is P => p !== undefined)),
          switchMap(regState =>
            regState.length === 0
              ? of<S[]>([])
              : combineLatest(regState.map(prop => pond.observe(makeEntityFish(prop))))
          )
        )
      )
    )
  }
  /**
   * Use your complex registry fish to get the state of the required entities.
   *
   * @typeParam RegS       - Type of the observed registry Fish’s state.
   * @typeParam P          - Type of the properties used to initialize Fish.
   * @typeParam S          - Type of the observed Fish’s state.
   *
   * @param registryFish   - A `Fish<any, RegS>` to observe to get a list of the entities to observe
   * @param mapToProperty  - Map the state of the registry fish to an array of entity fish properties.
   * @param makeEntityFish - Factory function to create a Fish with state `S` from an property of type `P`.
   *                         `undefined` may be returned to indicate the given value should not be converted to a Fish at all.
   * @param onStateChanged - Function that will be called with the array of states whenever the set of Fish
   *                         changes or any of the contained Fish’s state changes.
   *
   * @returns              A function that can be called in order to cancel the subscription
   */
  observeRegistry<RegS, P, S>(
    registryFish: Fish<any, RegS>,
    mapToProperty: (regState: RegS) => ReadonlyArray<P | undefined>,
    makeEntityFish: (seedEvent: P) => Fish<S, any>,
    onStateChanged: (states: S[]) => void
  ): CancelSubscription {
    return this.observeRegistry$(registryFish, mapToProperty, makeEntityFish)
      .subscribe({next: states => onStateChanged(states)})
      .unsubscribe
  }
  /**
   * Create Fish from events and observe them all.
   * Note that if a Fish created from some event f0 will also observe events earlier than f0, if they are selected by `where`
   *
   * @typeParam F        - Type of the events used to initialize Fish.
   * @typeParam S        - Type of the observed Fish’s state.
   *
   * @param seedEventsSelector  - A `Where<F>` object identifying the seed events to start Fish from
   * @param makeFish     - Factory function to create a Fish with state `S` from an event of type `F`.
   *                       If Fish with same FishId are created by makeFish, these Fish must be identical!
   *                       `undefined` may be returned to indicate the given seed event should not be converted to a Fish at all.
   * @param opts         - Optional arguments regarding caching and expiry
   * @param callback     - Function that will be called with the array of states whenever the set of Fish
   *                       changes or any of the contained Fish’s state changes.
   *
   * @returns              A Promise of a function that can be called in order to cancel the subscription.
   *
   * @beta
   */
  observeAll<ESeed, S>(seedEventsSelector: Where<ESeed>, makeFish: (seedEvent: ESeed) => Fish<S, any> | undefined, opts: ObserveAllOpts, onStateChanged: (states: S[]) => void): Promise<CancelSubscription> {
    return this.getPond().then(pond => pond.observeAll(seedEventsSelector, makeFish, opts, onStateChanged))
  }
  /**
   * Find the event selected by `firstEvent`, and start a Fish from it.
   * It is legal for `firstEvent` to actually select multiple events;
   * however, `makeFish` must yield the same Fish no matter one is passed in.
   *
   * @typeParam F        - Type of the initial event.
   * @typeParam S        - Type of the observed Fish’s state.
   *
   * @param seedEventSelector   - A `Where<F>` object identifying the seed event
   * @param makeFish     - Factory function to create the Fish with state `S` from the event of type `F`.
   *                       The Fish is able to observe events earlier than the first event.
   * @param callback     - Function that will be called with the Fish’s state `S`.
   *                       As long as the first event does not exist, this callback will also not be called.
   *
   * @returns              A Promise of a function that can be called in order to cancel the subscription.
   *
   * @beta
   */
  observeOne<ESeed, S>(seedEventSelector: Where<ESeed>, makeFish: (seedEvent: ESeed) => Fish<S, any>, onStateChanged: (newState: S) => void, stoppedByError?: (err: unknown) => void): Promise<CancelSubscription> {
    return this.getPond().then(pond => pond.observeOne(seedEventSelector, makeFish, onStateChanged, stoppedByError))
  }
  /**
   * Register a callback invoked whenever the Pond’s state changes.
   * The `PondState` is a general description of activity within the Pond internals.
   */
  getPondState(callback: (newState: PondState) => void) {
    return this.getPond().then(pond => pond.getPondState(callback))
  }
  /**
   * Observe the current state of a Fish.
   *
   * Caching is done based on the `fishId` inside the `fish`, i.e. if a fish with the included
   * `fishId` is already known, that other Fish’s ongoing aggregation will be used instead of
   * starting a new one.
   *
   * @param fish       - Complete Fish information.
   * @returns            An Observable of updated states. Each published state will be stricter newer than the last one.
   *                     (One state is buffered and immediately supplied to new subscribers.)
   */
  observe$<S,E>(fish: Fish<S,E>): Observable<S> {
    return from(this.getRxPond()).pipe(switchMap(rxP => rxP.observe(fish)))
  }
  /**
   * Create Fish from events and observe them all.
   * Note that if a Fish created from some event f0 will also observe events earlier than f0, if they are selected by `where`
   *
   * @typeParam F        - Type of the events used to initialize Fish.
   * @typeParam S        - Type of the observed Fish’s state.
   *
   * @param seedEventsSelector  - A `Where<F>` object identifying the seed events to start Fish from
   * @param makeFish     - Factory function to create a Fish with state `S` from an event of type `F`.
   *                       If Fish with same FishId are created by makeFish, these Fish must be identical!
   *                       `undefined` may be returned to indicate the given seed event should not be converted to a Fish at all.
   * @param opts         - Optional arguments regarding caching and expiry
   *
   * @returns            An Observable of updated states. At least one published state will be stricter newer than the last one.
   *                     (The last states are buffered and immediately supplied to new subscribers.)
   *
   * @beta
   */
  observeAll$<ESeed, S>(seedEventsSelector: Where<ESeed>, makeFish: (seedEvent: ESeed) => Fish<S, any> | undefined, opts: ObserveAllOpts): Observable<S[]> {
    return from(this.getRxPond()).pipe(switchMap(rxP => rxP.observeAll(seedEventsSelector, makeFish, opts)))
  }
  /**
   * Find the event selected by `firstEvent`, and start a Fish from it.
   * It is legal for `firstEvent` to actually select multiple events;
   * however, `makeFish` must yield the same Fish no matter one is passed in.
   *
   * @typeParam F        - Type of the initial event.
   * @typeParam S        - Type of the observed Fish’s state.
   *
   * @param seedEventSelector   - A `Where<F>` object identifying the seed event
   * @param makeFish     - Factory function to create the Fish with state `S` from the event of type `F`.
   *                       The Fish is able to observe events earlier than the first event.
   * @param callback     - Function that will be called with the Fish’s state `S`.
   *                       As long as the first event does not exist, this callback will also not be called.
   *
   * @returns              An Observable of updated states. At least one published state will be stricter newer than the last one.
   *                       As long as the first event does not exist, this callback will also not be called.
   *                       (The last states are buffered and immediately supplied to new subscribers.)
   *
   * @beta
   */
  observeOne$<ESeed, S>(seedEventsSelector: Where<ESeed>, makeFish: (seedEvent: ESeed) => Fish<S, any>): Observable<S> {
    return from(this.getRxPond()).pipe(switchMap(rxP => rxP.observeOne(seedEventsSelector, makeFish)))
  }
  /**
   * Information about the current pond
   */
  pondInfo(): Promise<PondInfo> {
    return this.getPond().then(pond => pond.info())
  }
  /**
   * Retrieve an Observable of `PondState`. It emits a new value whenever the internal state of the underlying Pond changes.
   */
  getPondState$() {
    return from(this.getRxPond()).pipe(switchMap(rxP => rxP.getPondState()))
  }
  /**
   * Get an Observable of this node’s connectivity information. Updates periodically.
   */
  getNodeConnectivity$() {
    return from(this.getRxPond()).pipe(switchMap(rxP => rxP.getNodeConnectivity()))
  }
  /**
   * Wait for the node to get in sync with the swarm.
   * It is strongly recommended that any interaction with the Pond is delayed until the Observable.
   * To obtain progress information about the sync, look at the intermediate values emitted by the Observable.
   */
  waitForSwarmSync$() {
    return from(this.getRxPond()).pipe(switchMap(rxP => rxP.waitForSwarmSync()))
  }
  /**
   * Run a `StateEffect` against currently known local state of Fish. Emit events based on it by
   * calling the `enqueue` function passed into the invocation of your effect. Every subsequent
   * invocation of `run` for the same Fish is guaranteed to see all events previously enqueued by
   * effects on that Fish already applied to the state. (Local serialisation guarantee.)
   *
   * In regards to other nodes or Fishes, there are no serialisation guarantees.
   *
   * @typeParam S              - State of the Fish, input value to the effect.
   * @typeParam EWrite         - Event type(s) the effect may emit.
   *
   * @param fish       - Complete Fish information.
   * @param effect     - Function to enqueue new events based on state.
   * @returns            A `PendingEmission` object that can be used to register callbacks with the effect’s completion.
   */
  run<S, EWrite>(fish: Fish<S, any>, fn: StateEffect<S, EWrite>): Promise<PendingEmission> {
    return this.getPond().then(pond => pond.run(fish, fn))
  }
  /**
   * Run a `StateEffect` against currently known local state of Fish. Emit events based on it by
   * calling the `enqueue` function passed into the invocation of your effect. Every subsequent
   * invocation of `run` for the same Fish is guaranteed to see all events previously enqueued by
   * effects on that Fish already applied to the state. (Local serialisation guarantee.)
   *
   * In regards to other nodes or Fishes, there are no serialisation guarantees.
   *
   * @typeParam S              - State of the Fish, input value to the effect.
   * @typeParam EWrite         - Event type(s) the effect may emit.
   *
   * @param fish       - Complete Fish information.
   * @param effect     - Function to enqueue new events based on state.
   * @returns            An Observable that completes when emission is done.
   *                      The Observable is *hot*, i.e. effect will run even when the Observable is not subscribed to.
   */
  run$<S, EWrite>(fish: Fish<S, any>, fn: StateEffect<S, EWrite>): Observable<void> {
    return from(this.getRxPond()).pipe(switchMap(rxP => rxP.run(fish, fn)))
  }
  /**
   * Install a StateEffect that will be applied automatically whenever the `Fish`’s State has changed.
   * Every application will see the previous one’s resulting Events applied to the State already, if applicable;
   * but any number of intermediate States may have been skipped between two applications.
   *
   * In regards to other nodes or Fishes, there are no serialisation guarantees.
   *
   * The effect can be uninstalled by calling the returned `CancelSubscription`.
   *
   * @typeParam S              - State of the Fish, input value to the effect.
   * @typeParam EWrite         - Event type(s) the effect may emit.
   *
   * @param fish       - Complete Fish information.
   * @param effect     - Function that decides whether to enqueue new events based on the current state.
   * @param autoCancel - Condition on which the automatic effect will be cancelled -- state on which `autoCancel` returns `true`
   *                     will be the first state the effect is *not* applied to anymore. Keep in mind that not all intermediate
   *                     states will be seen by this function.
   * @returns            A `CancelSubscription` object that can be used to cancel the automatic effect.
   */
  keepRunning<S, EWrite>(fish: Fish<S, any>, fn: StateEffect<S, EWrite>, autoCancel?: ((state: S) => boolean) | undefined) {
    return this.getPond().then(pond => pond.keepRunning(fish, fn, autoCancel))
  }
}
