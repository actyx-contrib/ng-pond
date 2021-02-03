import { Fish, FishId, Pond, Tag } from '@actyx/pond'
export type State =
  | { state: 'idle', machineId: string }
  | { state: 'inProduction', machineId: string, orderId: string }
export type Event =
  | { type: 'prodStarted', machineId: string, orderId: string }
  | { type: 'prodStopped', machineId: string, orderId: string }

const machineTag = Tag<Event>('machine')

export const MachineFish = {
  tags: { machineTag },
  of: (machineId: string): Fish<State, Event> => ({
    fishId: FishId.of('machineFish', machineId, 0),
    initialState: { state: 'idle', machineId },
    where: machineTag.withId(machineId),
    onEvent: (state, event) => {
      switch (event.type) {
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
  registry: (): Fish<string[], Event> => ({
    fishId: FishId.of('machineReg', 'reg', 0),
    initialState: [],
    where: machineTag,
    onEvent: (state, event) => {
      if (!state.includes(event.machineId)) {
        state.push(event.machineId)
      }
      return state
    },
  }),
  emitProdStoppedEvent: (pond: Pond, machineId: string, orderId: string) =>
    pond.emit(
      machineTag.withId(machineId),
      { type: 'prodStopped', machineId, orderId }
    ),
  emitProdStartedEvent: (pond: Pond, machineId: string, orderId: string) =>
    pond.emit(
      machineTag.withId(machineId),
      { type: 'prodStarted', machineId, orderId }
    ),
}
