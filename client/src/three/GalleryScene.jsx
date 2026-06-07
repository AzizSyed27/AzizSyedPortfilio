// R3F gallery scene — generic GLTF viewer driven by a preset object.
// Mounted inside Gallery3D's .g3d-stage slot on Home. Lazy-loaded;
// preloads every preset's GLB at module evaluation so switching between
// models is instant after the first.
//
// Phase-2 hand input plugs into the same rotateModel / zoomModel actions
// via GalleryContext.

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useGallery } from "../intents/GalleryContext";

export const SCENE_PRESETS = {
  e46: {
    url: "/models/low_poly_bmw_m3-gtr.glb",
    targetSize: 5,
    cameraPos: [3.8, 1.6, 4.2],
    cameraFov: 38,
    target: [0, 0.2, 0],
    polar: [0.6, 1.55],
    distance: [1.2, 14],
    autoRotateSpeed: 0.35,
    contactShadow: { y: -0.4, opacity: 0.4, blur: 2.5, far: 3 },
  },
  fisherboy: {
    url: "/models/fisherboy.glb",
    targetSize: 3.2,
    cameraPos: [3.3, 1.5, 4.5],
    cameraFov: 36,
    target: [0, 0, 0],
    polar: [0.5, 1.5],
    distance: [1.2, 12],
    autoRotateSpeed: 0.22,
    contactShadow: { y: -1.6, opacity: 0.35, blur: 2.0, far: 2.5 },
  },
  forest: {
    url: "/models/Low_Poly_Forest.glb",
    targetSize: 8,
    cameraPos: [5.0, 3.5, 5.5],
    cameraFov: 40,
    target: [0, 0.5, 0],
    polar: [0.5, 1.4],
    distance: [3, 18],
    autoRotateSpeed: 0.15,
    contactShadow: { y: -1.5, opacity: 0.3, blur: 3.0, far: 4 },
  },
  court: {
    url: "/models/basketball_court__low-poly.glb",
    targetSize: 10,
    cameraPos: [6.0, 5.0, 7.5],
    cameraFov: 38,
    target: [0, 0.4, 0],
    polar: [0.4, 1.45],
    distance: [3, 22],
    autoRotateSpeed: 0.18,
    contactShadow: { y: -0.5, opacity: 0.25, blur: 3.0, far: 5 },
  },
  cat: {
    url: "/models/cat_-_ps1_low_poly_rigged.glb",
    targetSize: 3.0,
    cameraPos: [3.6, 1.7, 4.8],
    cameraFov: 36,
    target: [0, 0.1, 0],
    polar: [0.5, 1.5],
    distance: [1.5, 14],
    autoRotateSpeed: 0.3,
    contactShadow: { y: -0.85, opacity: 0.35, blur: 2.0, far: 2.5 },
  },
};

// Kick off the fetch the moment this module is evaluated — paired with
// the lazy import in Gallery3D, this means every GLB starts loading the
// instant the Home page is shown.
Object.values(SCENE_PRESETS).forEach((p) => useGLTF.preload(p.url));

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

// THREE.Box3.setFromObject uses each mesh's REST-pose geometry box, which for a
// rigged/skinned GLB can be wildly off from how the mesh actually renders once
// posed by its skeleton. This walks the posed vertices (applyBoneTransform) so
// the fit reflects what's on screen. Used only when a skinned mesh is present.
function posedBox(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  root.traverse((o) => {
    if (o.isSkinnedMesh && o.skeleton && o.geometry?.attributes?.position) {
      o.skeleton.update();
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        o.applyBoneTransform(i, v);
        o.localToWorld(v);
        box.expandByPoint(v);
      }
    } else if (o.isMesh && o.geometry) {
      o.geometry.computeBoundingBox();
      box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
    }
  });
  return box;
}

function GLTFModel({ url, targetSize, autoRotateSpeed }) {
  const groupRef = useRef();
  const { scene } = useGLTF(url);

  // Recenter + uniform-scale the GLB so its longest axis is targetSize.
  // Cloned so a fresh scale is computed per preset (and so unmount doesn't
  // mutate the cached source).
  const fitted = useMemo(() => {
    // Detect skinned meshes on the source. SkinnedMesh needs SkeletonUtils.clone
    // (plain Object3D.clone doesn't rebind the skeleton to the cloned bones, so
    // both the render pose and any bounding-box measurement come out wrong).
    let skinned = false;
    scene.traverse((obj) => { if (obj.isSkinnedMesh) skinned = true; });
    const root = skinned ? skeletonClone(scene) : scene.clone(true);
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
    // Skinned models need a pose-aware box; static meshes are fine with the
    // cheaper setFromObject.
    const box = skinned
      ? posedBox(root)
      : new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const max = Math.max(size.x, size.y, size.z) || 1;
    const k = targetSize / max;
    root.position.sub(center).multiplyScalar(k);
    root.scale.setScalar(k);
    return root;
  }, [scene, targetSize]);

  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  useFrame((_, dt) => {
    if (!reduced && groupRef.current) {
      groupRef.current.rotation.y += dt * autoRotateSpeed;
    }
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

function ControlsBridge({ preset }) {
  const controlsRef = useRef();
  const { registerHandlers } = useGallery();
  const [minD, maxD] = preset.distance;
  const [polarMin, polarMax] = preset.polar;

  useEffect(() => {
    registerHandlers({
      rotate: (dx, dy) => {
        const c = controlsRef.current;
        if (!c) return;
        c.setAzimuthalAngle(c.getAzimuthalAngle() + dx * 0.01);
        c.setPolarAngle(clamp(c.getPolarAngle() + dy * 0.01, polarMin, polarMax));
        c.update();
      },
      zoom: (factor) => {
        const c = controlsRef.current;
        if (!c || !c.object) return;
        const cam = c.object;
        const target = c.target;
        const offset = cam.position.clone().sub(target);
        const next = clamp(offset.length() * factor, minD, maxD);
        offset.setLength(next);
        cam.position.copy(target).add(offset);
        c.update();
      },
    });
  }, [registerHandlers, minD, maxD, polarMin, polarMax]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      autoRotate
      autoRotateSpeed={0.6}
      enablePan={false}
      minDistance={minD}
      maxDistance={maxD}
      minPolarAngle={polarMin}
      maxPolarAngle={polarMax}
      target={preset.target}
    />
  );
}

export function GalleryScene({ preset = SCENE_PRESETS.e46 }) {
  const cs = preset.contactShadow;
  return (
    <Canvas
      key={preset.url} // clean remount when switching models, so camera re-fits
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: preset.cameraPos, fov: preset.cameraFov, near: 0.05, far: 100 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <Lights />
      <Suspense fallback={<LoadingCube />}>
        <GLTFModel
          url={preset.url}
          targetSize={preset.targetSize}
          autoRotateSpeed={preset.autoRotateSpeed}
        />
      </Suspense>
      <ContactShadows position={[0, cs.y, 0]} opacity={cs.opacity} blur={cs.blur} far={cs.far} />
      <ControlsBridge preset={preset} />
    </Canvas>
  );
}

export default GalleryScene;
