import {
  dispatchSimControlMessage,
  SIM_START_PATTERN,
  SIM_STOP_PATTERN,
} from './sim-control-consumer';

describe('dispatchSimControlMessage', () => {
  it('handles Nest-style sim.start commands', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();

    dispatchSimControlMessage(
      Buffer.from(
        JSON.stringify({
          pattern: SIM_START_PATTERN,
          data: { fleetSize: 4, emitRatePerSecond: 2 },
        }),
      ),
      { onStart, onStop },
    );

    expect(onStart).toHaveBeenCalledWith({
      fleetSize: 4,
      emitRatePerSecond: 2,
    });
    expect(onStop).not.toHaveBeenCalled();
  });

  it('handles sim.stop commands', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();

    dispatchSimControlMessage(
      Buffer.from(JSON.stringify({ pattern: SIM_STOP_PATTERN, data: {} })),
      { onStart, onStop },
    );

    expect(onStop).toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
  });
});
