// R3F gallery scene. Lazy-loaded; pulls in three + drei.
// When the user drops a GLTF into /public/models/e46.glb, the E46Model
// renders the real model — otherwise a primitive wireframe stands in.
// rotateModel / zoomModel actions plug straight into OrbitControls.

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Edges, Environment, useGLTF } from "@react-three/drei";
import { useGallery } from "../intents/GalleryContext";

function E46Placeholder() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.4;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[3.2, 0.9, 1.6]} />
      <meshStandardMaterial color="#4FDFFF" wireframe />
      <Edges color="#8BEBFF" />
    </mesh>
  );
}

function E46Real({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.2} />;
}

function E46Model() {
  // If the user has placed /models/e46.glb we load it; otherwise primitive.
  // useGLTF will throw if the file is missing; Suspense + ErrorBoundary not
  // needed when we conditionally render based on a fetch check.
  const url = "/models/e46.glb";
  return (
    <Suspense fallback={<E46Placeholder />}>
      <CheckedGltf url={url} />
    </Suspense>
  );
}

function CheckedGltf({ url }) {
  const ref = useRef();
  const ok = useRef(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: "HEAD" }).then((r) => {
      if (!cancelled) ok.current = r.ok;
    }).catch(() => { ok.current = false; });
    return () => { cancelled = true; };
  }, [url]);
  if (ok.current === false) return <E46Placeholder />;
  if (ok.current === null)  return <E46Placeholder />;
  return <E46Real url={url} />;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
    </>
  );
}

function Controls() {
  const controlsRef = useRef();
  const { registerHandlers } = useGallery();
  useEffect(() => {
    registerHandlers({
      rotate: (dx, dy) => {
        const c = controlsRef.current;
        if (!c) return;
        c.azimuthAngle = (c.azimuthAngle ?? 0) + dx * 0.01;
        c.polarAngle   = Math.max(0.1, Math.min(Math.PI - 0.1, (c.polarAngle ?? Math.PI / 2) + dy * 0.01));
        c.update();
      },
      zoom: (factor) => {
        const c = controlsRef.current;
        if (!c?.object) return;
        c.object.position.multiplyScalar(factor);
        c.update();
      },
    });
  }, [registerHandlers]);
  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08} />;
}

export function GalleryScene() {
  return (
    <Canvas style={{ width: "100%", height: "100%", minHeight: 440 }} camera={{ position: [4, 2, 6], fov: 45 }}>
      <Lights />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      <E46Model />
      <Controls />
    </Canvas>
  );
}
