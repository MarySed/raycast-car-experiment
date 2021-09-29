import React, { Suspense, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useLoader } from '@react-three/fiber';
import { Physics, useCylinder, usePlane, useBox } from '@react-three/cannon';
import { OrbitControls, Environment } from '@react-three/drei';
import Vehicle from './Vehicle';

const Letter = (props) => {
  const [ref] = useBox(() => ({ mass: 100, ...props }));

  const font = useLoader(THREE.FontLoader, 'IBM_Plex_Serif_Bold.json');

  const config = useMemo(
    () => ({
      font,
      size: 1.5,
      height: 0.4,
      curveSegments: 24,
      bevelEnabled: false,
      bevelThickness: 0,
      bevelSize: 0.3,
      bevelOffset: 0,
      bevelSegments: 10
    }),
    [font]
  );

  return (
    <mesh ref={ref}>
      <textBufferGeometry args={[props.children, config]} />
      <meshPhongMaterial />
    </mesh>
  );
};

const Box = (props) => {
  const [ref] = useBox(() => ({ mass: 1, ...props }));

  return (
    <mesh ref={ref}>
      <boxBufferGeometry />
      <meshPhongMaterial />
    </mesh>
  );
};

const Plane = (props) => {
  const [ref] = usePlane(() => ({ type: 'Static', material: 'ground', ...props }));

  return (
    <group ref={ref}>
      <mesh receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={props.bgColor} />
      </mesh>
    </group>
  );
};

const Pillar = ({ args = [0.7, 0.7, 5, 16], onCollide, ...props }) => {
  const [ref] = useCylinder(() => ({ mass: 10, args, ...props }));
  return (
    <mesh ref={ref} castShadow>
      <cylinderGeometry args={args} />
      <meshPhongMaterial />
    </mesh>
  );
};

export default function App() {
  const [bgColor, setBgColor] = useState(['#FFB344']);

  // #171720
  return (
    <>
      <Canvas dpr={[1, 1.5]} shadows camera={{ position: [0, 5, 15], fov: 50 }}>
        <fog attach="fog" args={['#FFB344', 10, 50]} />
        <color attach="background" args={bgColor} />
        <ambientLight intensity={0.4} color={'#FFB344'} />
        <directionalLight position={[0, 1000, 0]} intensity={0.2} />
        <spotLight position={[10, 10, 10]} angle={0.5} intensity={1} castShadow penumbra={0.8} />
        <Physics broadphase="SAP" contactEquationRelaxation={4} friction={1e-3} allowSleep>
          <Letter position={[-4, 1, 5]}>H</Letter>
          <Letter position={[-2, 1, 5]}>E</Letter>
          <Letter position={[0, 1, 5]}>L</Letter>
          <Letter position={[2, 1, 5]}>L</Letter>
          <Letter position={[4, 1, 5]}>0</Letter>
          <Plane rotation={[-Math.PI / 2, 0, 0]} userData={{ id: 'floor' }} bgColor={bgColor[0]} />
          <Vehicle position={[0, 2, 0]} rotation={[0, -Math.PI / 4, 0]} angularVelocity={[0, 1, 0]} wheelRadius={2} />
          <Pillar position={[-5, 2.5, -5]} userData={{ id: 'pillar-1', health: 100 }} />
          <Pillar position={[0, 2.5, -5]} userData={{ id: 'pillar-2', health: 100 }} />
          <Pillar position={[5, 2.5, -5]} userData={{ id: 'pillar-3', health: 100 }} />
          <Box position={[2, 2.5, 0]} userData={{ id: 'box-1', health: 80 }} />
        </Physics>
        <Suspense fallback={null}>
          <Environment preset="night" />
        </Suspense>
        <OrbitControls />
      </Canvas>

      <div style={{ position: 'absolute', top: 30, left: 40 }}>
        <pre>
          Will not work in the codesandbox preview.
          <br />
          WASD to drive, space to brake
          <br />R to reset
        </pre>
      </div>
    </>
  );
}
