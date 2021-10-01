import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRaycastVehicle } from '@react-three/cannon';
import { useControls } from './utils/useControls';
import Drifter from './Drifter';
import Wheel from './Wheel';

function Vehicle({ radius = 0.7, width = 1.2, height = 0.3, front = 1.3, back = -1.15, steer = 0.6, force = 2000, maxBrake = 1e5, ...props }) {
  const chassis = useRef();
  const wheel1 = useRef();
  const wheel2 = useRef();
  const wheel3 = useRef();
  const wheel4 = useRef();
  const controls = useControls();

  const wheelInfo = {
    radius,
    directionLocal: [0, -1, 0],
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    maxSuspensionForce: 1e4,
    maxSuspensionTravel: 0.3,
    dampingRelaxation: 10,
    dampingCompression: 4.4,
    axleLocal: [-1, 0, 0],
    chassisConnectionPointLocal: [1, 0, 1],
    useCustomSlidingRotationalSpeed: true,
    customSlidingRotationalSpeed: -30,
    frictionSlip: 2
  };

  const wheelInfo1 = { ...wheelInfo, isFrontWheel: true, chassisConnectionPointLocal: [-width / 1.5, height, front] };
  const wheelInfo2 = { ...wheelInfo, isFrontWheel: true, chassisConnectionPointLocal: [width / 1.5, height, front] };
  const wheelInfo3 = { ...wheelInfo, isFrontWheel: false, chassisConnectionPointLocal: [-width / 1.5, height, back] };
  const wheelInfo4 = { ...wheelInfo, isFrontWheel: false, chassisConnectionPointLocal: [width / 1.5, height, back] };

  const [vehicle, api] = useRaycastVehicle(() => ({
    chassisBody: chassis,
    wheels: [wheel1, wheel2, wheel3, wheel4],
    wheelInfos: [wheelInfo1, wheelInfo2, wheelInfo3, wheelInfo4],
    indexForwardAxis: 2,
    indexRightAxis: 0,
    indexUpAxis: 1
  }));

  const resetCar = () => {
    chassis.current.api.position.set(0, 0.5, 0);
    chassis.current.api.velocity.set(0, 0, 0);
    chassis.current.api.angularVelocity.set(0, 0.5, 0);
    chassis.current.api.rotation.set(0, -Math.PI / 4, 0);
  };

  useFrame(() => {
    const { forward, backward, left, right, brake, reset } = controls.current;

    const forceMultiplier = forward && !backward ? -1 : 1;
    forward || backward ? api.applyEngineForce(force * forceMultiplier, 0) : api.applyEngineForce(0, 0);

    // S is referring to the front wheels
    for (let s = 0; s < 2; s++) {
      const steerMultiplier = left && !right ? 1 : -1;

      left || right ? api.setSteeringValue(steer * steerMultiplier, s) : api.setSteeringValue(0, s);
    }

    // B is referring to the back wheels
    for (let b = 2; b < 4; b++) {
      const brakeMultipler = brake ? maxBrake : 0;
      api.setBrake(brakeMultipler, b);
    }

    if (reset) {
      resetCar();
      return;
    }
  });

  return (
    <group ref={vehicle} position={[0, -0.3, 0]}>
      <Drifter ref={chassis} rotation={props.rotation} position={props.position} angularVelocity={props.angularVelocity} />
      <Wheel ref={wheel1} radius={radius} leftSide />
      <Wheel ref={wheel2} radius={radius} />
      <Wheel ref={wheel3} radius={radius} leftSide />
      <Wheel ref={wheel4} radius={radius} />
    </group>
  );
}

export default Vehicle;
