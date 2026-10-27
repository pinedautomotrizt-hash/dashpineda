import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// El mismo .glb ya lo bajo la vista explosionada: con la cache de three no se
// vuelve a descargar al abrir el modal.
THREE.Cache.enabled = true;

// Muestra aislada una capa del vehiculo (solo sus mallas), girando, para el
// modal de detalle. Se encuadra sobre la pieza, no sobre el auto completo.
export default function VistaPieza({ modelo, capaId, color }) {
  const contenedorRef = useRef(null);
  const [estado, setEstado] = useState('cargando');

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || !modelo) return undefined;
    const materiales = new Set(modelo.materiales[capaId] || []);
    // Los materiales no listados caen en "exterior" (igual que en el despiece).
    const listados = new Set(Object.values(modelo.materiales).flat());
    const esDeLaCapa = (nombre) => materiales.has(nombre) || (capaId === 'exterior' && !listados.has(nombre));

    const escena = new THREE.Scene();
    escena.background = new THREE.Color('#f8fafc');
    const camara = new THREE.PerspectiveCamera(35, contenedor.clientWidth / contenedor.clientHeight, 0.01, 100);
    const render3d = new THREE.WebGLRenderer({ antialias: true });
    render3d.setSize(contenedor.clientWidth, contenedor.clientHeight);
    render3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render3d.outputColorSpace = THREE.SRGBColorSpace;
    contenedor.appendChild(render3d.domElement);

    const controles = new OrbitControls(camara, render3d.domElement);
    controles.enableDamping = true;
    controles.enablePan = false;
    controles.autoRotate = true;
    controles.autoRotateSpeed = 1.6;

    escena.add(new THREE.HemisphereLight('#ffffff', '#cbd5e1', 2.4));
    const luz = new THREE.DirectionalLight('#ffffff', 2.4);
    luz.position.set(3, 5, 4);
    escena.add(luz);
    const contraluz = new THREE.DirectionalLight('#ffffff', 1.2);
    contraluz.position.set(-4, 2, -3);
    escena.add(contraluz);

    let cancelado = false;
    setEstado('cargando');
    new GLTFLoader().load(
      modelo.url,
      (gltf) => {
        if (cancelado) return;
        const raiz = gltf.scene;
        raiz.updateMatrixWorld(true);
        const pieza = new THREE.Group();
        const mallas = [];
        raiz.traverse((obj) => { if (obj.isMesh) mallas.push(obj); });
        mallas.forEach((malla) => {
          const material = Array.isArray(malla.material) ? malla.material[0] : malla.material;
          if (!esDeLaCapa(material?.name)) return;
          // Vidrios casi transparentes no se verian solos: se les da cuerpo.
          if (material.transparent && material.opacity < 0.5) {
            malla.material = material.clone();
            malla.material.opacity = 0.55;
            malla.material.color = new THREE.Color(color || '#0284c7');
          }
          pieza.attach(malla);
        });
        if (!pieza.children.length) {
          setEstado('vacio');
          return;
        }
        // Centrar la pieza en el origen y encuadrar la camara a su tamaño.
        const caja = new THREE.Box3().setFromObject(pieza);
        const centro = caja.getCenter(new THREE.Vector3());
        pieza.position.sub(centro);
        escena.add(pieza);
        const radio = caja.getBoundingSphere(new THREE.Sphere()).radius || 1;
        const distancia = radio / Math.sin(THREE.MathUtils.degToRad(camara.fov / 2)) * 1.05;
        camara.position.set(distancia * 0.75, distancia * 0.45, distancia * 0.6);
        camara.near = distancia / 100;
        camara.far = distancia * 10;
        camara.updateProjectionMatrix();
        controles.minDistance = distancia * 0.4;
        controles.maxDistance = distancia * 2.5;
        controles.target.set(0, 0, 0);
        setEstado('listo');
      },
      undefined,
      () => { if (!cancelado) setEstado('error'); },
    );

    let frame = 0;
    const animar = () => {
      controles.update();
      render3d.render(escena, camara);
      frame = requestAnimationFrame(animar);
    };
    animar();

    return () => {
      cancelado = true;
      cancelAnimationFrame(frame);
      controles.dispose();
      render3d.dispose();
      if (render3d.domElement.parentNode === contenedor) contenedor.removeChild(render3d.domElement);
    };
  }, [modelo, capaId, color]);

  return (
    <div className="relative h-full min-h-[260px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div ref={contenedorRef} className="absolute inset-0" />
      {estado === 'cargando' && <div className="absolute inset-0 grid place-items-center text-xs text-slate-500">Cargando pieza…</div>}
      {estado === 'vacio' && <div className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-slate-500">Este modelo no tiene piezas separadas para esta parte.</div>}
      {estado === 'error' && <div className="absolute inset-0 grid place-items-center text-xs text-slate-500">No se pudo cargar la pieza.</div>}
      <p className="absolute bottom-1.5 left-2 text-[10px] text-slate-400">{modelo?.nombre} · arrastra para girar</p>
    </div>
  );
}
