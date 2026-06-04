// R3F gallery scene — renders the BMW M3 GTR GLTF inside Gallery3D's
// .g3d-stage slot on Home. Lazy-loaded; preloads the GLB at module evaluation
// so by the time <Canvas> mounts the model is already in cache.
// Phase-2 hand input plugs into the same rotateModel / zoomModel actions
// via GalleryContext.

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGallery } from "../intents/GalleryContext";

const MODEL_URL = "/models/low_poly_bmw_m3-gtr.glb";
const TARGET_SIZE = 5; // longest model axis, in scene units

// Kick off the fetch the moment this module is evaluated — paired with the
// lazy import in Gallery3D, this means the GLB starts loading the instant
// the Home page is shown.
useGLTF.preload(MODEL_URL);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function LoadingCube() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[2, 0.7, 1.3]} />
      <meshStandardMaterial color="#4FDFFF" wireframe />
    </mesh>
  );
}

function CarModel() {
  const groupRef = useRef();
  const { scene } = useGLTF(MODEL_URL);

  // Recenter + uniform-scale the GLB so its longest axis is TARGET_SIZE.
  // Done once, in a layout effect, before the first paint.
  const fitted = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const max = Math.max(size.x, size.y, size.z) || 1;
    const k = TARGET_SIZE / max;
    root.position.sub(center).multiplyScalar(k);
    root.scale.setScalar(k);
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
    return root;
  }, [scene]);

  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  useFrame((_, dt) => {
    if (!reduced && groupRef.current) groupRef.current.rotation.y += dt * 0.35;
  });

  return (
    <group ref={groupRef}>
      <primitive object={fitted} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#ffffff", "#202020", 0.35]} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />
    </>
  );
}

function ControlsBridge() {
  const controlsRef = useRef();
  const { registerHandlers } = useGallery();

  useEffect(() => {
    registerHandlers({
      rotate: (dx, dy) => {
        const c = controlsRef.current;
        if (!c) return;
        c.setAzimuthalAngle(c.getAzimuthalAngle() + dx * 0.01);
        c.setPolarAngle(clamp(c.getPolarAngle() + dy * 0.01, 0.6, 1.55));
        c.update();
      },
      zoom: (factor) => {
        const c = controlsRef.current;
        if (!c || !c.object) return;
        const cam = c.object;
        const target = c.target;
        const offset = cam.position.clone().sub(target);
        const dist = offset.length();
        const next = clamp(dist * factor, 1.2, 14);
        offset.setLength(next);
        cam.position.copy(target).add(offset);
        c.update();
      },
    });
  }, [registerHandlers]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      autoRotate
      autoRotateSpeed={0.6}
      enablePan={false}
      minDistance={1.2}
      maxDistance={14}
      minPolarAngle={0.6}
      maxPolarAngle={1.55}
      target={[0, 0.2, 0]}
    />
  );
}

export function GalleryScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [3.8, 1.6, 4.2], fov: 38, near: 0.05, far: 100 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <Lights />
      <Suspense fallback={<LoadingCube />}>
        <CarModel />
      </Suspense>
      <ContactShadows position={[0, -0.4, 0]} opacity={0.4} blur={2.5} far={3} />
      <ControlsBridge />
    </Canvas>
  );
}

export default GalleryScene;
