import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Visor 3D generico (escena, camara, luces, carga del .glb, giro automatico).
// Compartido entre DashboardPage (modelo destacado + modal de ranking) y
// EmpresaDetalle (modelo mas frecuente de la flota del cliente).
export default function Vehicle3DViewer({ modelUrl, heightClass = 'h-64', loadingLabel = 'Cargando modelo 3D...' }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    setLoading(true);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8fafc');

    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(4.8, 1.7, 5.4);
    camera.lookAt(0, 0.25, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#ffffff', '#cbd5e1', 2.3));

    const key = new THREE.DirectionalLight('#ffffff', 3.2);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight('#dbeafe', 1.4);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 64),
      new THREE.ShadowMaterial({ color: '#64748b', opacity: 0.16 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    let model = null;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z) || 1;
        const scale = 3.9 / maxSize;

        // El centrado tiene que calcularse DESPUES de escalar: position no se
        // reescala junto con el modelo, así que centrar con el tamaño original
        // deja el offset sin ajustar y el modelo queda descuadrado. Y hay que
        // forzar updateMatrixWorld: Box3.setFromObject usa la matriz actual,
        // que no se recalcula sola hasta el siguiente render.
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        model.position.sub(scaledCenter);
        model.rotation.set(0, -0.55, 0);
        scene.add(model);
        setLoading(false);
      },
      undefined,
      () => setLoading(false),
    );

    let frameId = 0;
    const animate = () => {
      if (model) {
        model.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [modelUrl]);

  return (
    <div className={`relative ${heightClass} w-full overflow-hidden rounded-lg bg-slate-50`}>
      <div ref={mountRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-slate-50 text-sm font-medium text-slate-500">
          {loadingLabel}
        </div>
      )}
    </div>
  );
}
