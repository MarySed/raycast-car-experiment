import React, { useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useLoader } from '@react-three/fiber';
import { Physics, usePlane, useBox } from '@react-three/cannon';
import { OrbitControls } from '@react-three/drei';
import Vehicle from './Vehicle';

const Box = ({ setBgColor, position }) => {
  console.log(setBgColor, 'setBg');
  const [ref] = useBox(() => ({
    mass: 1,
    args: [2, 2, 2],
    position: position,
    onCollide: (e) => {
      console.log(e?.userData?.id === 'drifter', 'collided');
      if (!setBgColor) {
        return;
      }
    }
  }));

  return (
    <mesh ref={ref} castShadow>
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

const Letter = ({ offset, offsetZ, textGeo }) => {
  const position = new THREE.Vector3(offset, 2, offsetZ);

  const [ref] = useBox(() => ({
    mass: 100,
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

const Text = ({ text, textPosition, size, depth }) => {
  const font = useLoader(THREE.FontLoader, 'Oleo_Script_Regular.json');

  const config = useMemo(
    () => ({
      font,
      size: size,
      height: depth,
      curveSegments: 24,
      bevelEnabled: false
    }),
    [font, size, depth]
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

    const distanceToCenter = idx > 0 ? acc[acc.length - 1] + (currLetterWidth + prevLetterWidth) / 2 + letterSpacing : textPosition[0];
    acc.push(distanceToCenter);

    return acc;
  }, []);

  return letterGeometriesArr.map((textGeo, idx) => {
    return <Letter offsetZ={-5} offset={textOffsets[idx]} textGeo={textGeo} key={idx} />;
  });
};

const Lights = () => {
  return (
    <group>
      <ambientLight intensity={0.4} color={'#FFB344'} />
      <directionalLight position={[0, 1000, 0]} intensity={0.2} />
      <spotLight position={[10, 10, 10]} angle={0.5} intensity={1} castShadow penumbra={0.8} />
    </group>
  );
};

export default function App() {
  const [bgColor, setBgColor] = useState(['#FFB344']);

  const callbackBgColor = useCallback((color) => setBgColor(color), [bgColor]);

  return (
    <>
      <Canvas dpr={[1, 1.5]} shadows camera={{ position: [0, 5, 15], fov: 55 }}>
        <fog attach="fog" args={['#FFB344', 10, 50]} />
        <color attach="background" args={bgColor} />
        <Lights />
        <Physics broadphase="SAP" contactEquationRelaxation={4} friction={1e-3} allowSleep>
          <Text text="Halloween" textPosition={[-9, 0, 0]} size={4} depth={1} />
          <Plane rotation={[-Math.PI / 2, 0, 0]} userData={{ id: 'floor' }} bgColor={bgColor[0]} />
          <Vehicle position={[0, 2, 0]} rotation={[0, -Math.PI / 4, 0]} angularVelocity={[0, 1, 0]} wheelRadius={2} />
          <Box position={[-5, 2.5, 2]} userData={{ id: 'pillar-1', health: 100 }} />
          <Box position={[5, 2.5, 3]} userData={{ id: 'pillar-3', health: 100 }} />
          <Box position={[2, 2.5, 0]} userData={{ id: 'box-1', health: 80 }} />
        </Physics>
        <OrbitControls />
      </Canvas>

      <div style={{ position: 'absolute', top: 30, left: 40 }}>
        <h1 className="title">It's Halloween!</h1>
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
