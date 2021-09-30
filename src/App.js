import React, { Suspense, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useLoader } from '@react-three/fiber';
import { Physics, useCylinder, usePlane, useBox } from '@react-three/cannon';
import { OrbitControls, Environment } from '@react-three/drei';
import Vehicle from './Vehicle';

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

const Letter = ({ offset, offsetZ, textGeo }) => {
  const position = new THREE.Vector3(offset, 2, offsetZ);

  const [ref] = useBox(() => ({
    mass: 1000,
    position: [position.x, position.y, position.z],
    args: [textGeo?.textSize.x, textGeo?.textSize.y, textGeo?.textSize.z / 2]
  }));

  if (!textGeo) {
    return null;
  }

  return (
    <mesh ref={ref} castShadow>
      <primitive object={textGeo?.textGeo} attach="geometry" />
      <meshPhongMaterial />
    </mesh>
  );
};

const Text = ({ text, textPosition }) => {
  const font = useLoader(THREE.FontLoader, 'Oleo_Script_Regular.json');

  const config = useMemo(
    () => ({
      font,
      size: 2,
      height: 1,
      curveSegments: 24,
      bevelEnabled: false
    }),
    [font]
  );

  const letterGeometriesArr = text.split('').map((letter) => {
    const textGeo = new THREE.TextGeometry(letter, config);
    // You need to manually compute bounding box for geometries
    textGeo.computeBoundingBox();
    textGeo.center();

    // If you have the bounding box (initially null) get its size or else just create a new vector3
    const textSize = textGeo?.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();

    return { textGeo: textGeo, textSize: textSize };
  });

  const letterSpacing = 0.2;

  const textOffsets = letterGeometriesArr.reduce((acc, curr, idx, arr) => {
    const currLetterWidth = curr?.textSize?.x;
    const prevLetterWidth = arr[idx - 1]?.textSize?.x ?? 0;

    const distanceToCenter = idx > 0 ? acc[acc.length - 1] + (currLetterWidth + prevLetterWidth) / 2 + letterSpacing : 0;
    acc.push(distanceToCenter);

    return acc;
  }, []);

  return (
    <group position={textPosition}>
      {letterGeometriesArr.map((textGeo, idx) => {
        return <Letter offsetZ={-5} offset={textOffsets[idx]} textGeo={textGeo} key={idx} />;
      })}
    </group>
  );
};

export default function App() {
  const [bgColor, setBgColor] = useState(['#FFB344']);

  return (
    <>
      <Canvas dpr={[1, 1.5]} shadows camera={{ position: [0, 5, 15], fov: 70 }}>
        <fog attach="fog" args={['#FFB344', 10, 50]} />
        <color attach="background" args={bgColor} />
        <ambientLight intensity={0.4} color={'#FFB344'} />
        <directionalLight position={[0, 1000, 0]} intensity={0.2} />
        <spotLight position={[10, 10, 10]} angle={0.5} intensity={1} castShadow penumbra={0.8} />
        <Physics broadphase="SAP" contactEquationRelaxation={4} friction={1e-3} allowSleep>
          <Text text="Halloween" textPosition={[-5, 0, 0]} />
          <Plane rotation={[-Math.PI / 2, 0, 0]} userData={{ id: 'floor' }} bgColor={bgColor[0]} />
          <Vehicle position={[0, 2, 0]} rotation={[0, -Math.PI / 4, 0]} angularVelocity={[0, 1, 0]} wheelRadius={2} />
          <Pillar position={[-5, 2.5, 2]} userData={{ id: 'pillar-1', health: 100 }} />
          <Pillar position={[5, 2.5, 3]} userData={{ id: 'pillar-3', health: 100 }} />
          <Box position={[2, 2.5, 0]} userData={{ id: 'box-1', health: 80 }} />
        </Physics>
        <Suspense fallback={null}>
          <Environment preset="night" />
        </Suspense>
        <OrbitControls />
      </Canvas>

      <div style={{ position: 'absolute', top: 30, left: 40 }}>
        <h1 className="title">It's Halloween</h1>
        <div className="controls">
          <p className="controls-content">
            Use the <strong>arrow keys</strong> to drive
            <br />
            Hit the breaks with <strong>space</strong>
            <br />
            Reset the car with <strong>r</strong>
          </p>
        </div>
      </div>
    </>
  );
}
