// R3F gallery scene — generic GLTF viewer driven by a preset object.
// Mounted inside Gallery3D's .g3d-stage slot on Home. Lazy-loaded;
// preloads every preset's GLB at module evaluation so switching between
// models is instant after the first.
//
// Phase-2 hand input plugs into the same rotateModel / zoomModel actions
// via GalleryContext.

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useGallery } from "../intents/GalleryContext";
import { SCENE_PRESETS } from "./scenePresets";

// Re-export so existing importers of GalleryScene keep working; Gallery3D now
// imports it from scenePresets directly to avoid statically pulling this module.
export { SCENE_PRESETS };

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
  const { scene, animations } = useGLTF(url);

  // Recenter + uniform-scale the GLB so its longest axis is targetSize.
  // Cloned so a fresh scale is computed per preset (and so unmount doesn't
  // mutate the cached source). The fit lives on a wrapper group (see render),
  // NOT on the clone's own transform, so an animation clip targeting nodes
  // never fights the centering.
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
    const offset = center.multiplyScalar(-k);
    return { root, scale: k, offset: offset.toArray() };
  }, [scene, targetSize]);

  // Play any baked animation clips (looping). No-op for models without clips.
  const { actions } = useAnimations(animations, groupRef);
  useEffect(() => {
    const playing = Object.values(actions).filter(Boolean);
    playing.forEach((a) => a.reset().play());
    return () => playing.forEach((a) => a.stop());
  }, [actions]);

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
      <group scale={fitted.scale} position={fitted.offset}>
        <primitive object={fitted.root} />
      </group>
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

function ControlsBridge({ preset, live }) {
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
      autoRotate={!live}
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

export function GalleryScene({ preset = SCENE_PRESETS.e46, live = false }) {
  const cs = preset.contactShadow;
  return (
    <Canvas
      key={preset.url} // clean remount when switching models, so camera re-fits
      dpr={live ? [1, 1] : [1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: preset.cameraPos, fov: preset.cameraFov, near: 0.05, far: 100 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <Lights />
      <Suspense fallback={<LoadingCube />}>
        <GLTFModel
          url={preset.url}
          targetSize={preset.targetSize}
          autoRotateSpeed={live ? 0 : preset.autoRotateSpeed}
        />
      </Suspense>
      <ContactShadows position={[0, cs.y, 0]} opacity={cs.opacity} blur={cs.blur} far={cs.far} />
      <ControlsBridge preset={preset} live={live} />
    </Canvas>
  );
}

export default GalleryScene;
