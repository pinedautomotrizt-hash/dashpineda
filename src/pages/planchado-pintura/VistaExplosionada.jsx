import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { money, number } from '../../utils/formatters';
import { CAPAS } from './capas';

// Vista explosionada del vehiculo: las piezas se separan en capas verticales
// (carroceria arriba, ruedas abajo), como un despiece de catalogo.
//
// Los modelos (*_despiece.glb) son versiones optimizadas con las mismas mallas
// y nombres de material; cada malla se asigna a una capa por el nombre de su
// material (ver capas.js).
const LARGO = 4.2;        // largo al que se normaliza el modelo
const SEPARACION = 0.62;  // distancia vertical entre capas al despiezar

export default function VistaExplosionada({ modelo, capasData = [], seleccionada, onSeleccionar }) {
  const contenedorRef = useRef(null);
  const estadoRef = useRef({ objetivo: 0, actual: 0, seleccionada: null });
  const anclasRef = useRef([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [despiezado, setDespiezado] = useState(false);
  const [posiciones, setPosiciones] = useState({});

  useEffect(() => { estadoRef.current.objetivo = despiezado ? 1 : 0; }, [despiezado]);
  useEffect(() => { estadoRef.current.seleccionada = seleccionada || null; }, [seleccionada]);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || !modelo) return undefined;
    const capaPorMaterial = Object.fromEntries(
      Object.entries(modelo.materiales).flatMap(([capa, materiales]) => materiales.map((m) => [m, capa])),
    );
    anclasRef.current = [];
    estadoRef.current.actual = 0;
    setCargando(true);
    setError(false);
    setDespiezado(false);

    const escena = new THREE.Scene();
    escena.background = new THREE.Color('#f8fafc');
    const camara = new THREE.PerspectiveCamera(32, contenedor.clientWidth / contenedor.clientHeight, 0.1, 100);
    const render3d = new THREE.WebGLRenderer({ antialias: true });
    render3d.setSize(contenedor.clientWidth, contenedor.clientHeight);
    render3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render3d.outputColorSpace = THREE.SRGBColorSpace;
    contenedor.appendChild(render3d.domElement);

    const controles = new OrbitControls(camara, render3d.domElement);
    controles.enableDamping = true;
    controles.enablePan = false;
    controles.minDistance = 4;
    controles.maxDistance = 16;

    escena.add(new THREE.HemisphereLight('#ffffff', '#cbd5e1', 2.4));
    const principal = new THREE.DirectionalLight('#ffffff', 2.4);
    principal.position.set(4, 8, 5);
    escena.add(principal);
    const relleno = new THREE.DirectionalLight('#e0f2fe', 1.1);
    relleno.position.set(-5, 3, -4);
    escena.add(relleno);
    const piso = new THREE.Mesh(new THREE.CircleGeometry(3.6, 64), new THREE.MeshBasicMaterial({ color: '#e2e8f0' }));
    piso.rotation.x = -Math.PI / 2;
    escena.add(piso);

    // Una capa = un grupo; mover el grupo en Y es todo el despiece.
    const grupos = Object.fromEntries(CAPAS.map((capa) => [capa.id, new THREE.Group()]));
    const materialesPorCapa = Object.fromEntries(CAPAS.map((capa) => [capa.id, new Set()]));
    let altoBase = 1.6;
    let cancelado = false;

    new GLTFLoader().load(
      modelo.url,
      (gltf) => {
        if (cancelado) return;
        const modelo = gltf.scene;
        modelo.updateMatrixWorld(true);
        // El eje largo del vehiculo se lleva a X para que el despiece se vea de lado.
        const crudo = new THREE.Box3().setFromObject(modelo).getSize(new THREE.Vector3());
        if (crudo.z > crudo.x) modelo.rotation.y = Math.PI / 2;
        modelo.updateMatrixWorld(true);
        const tam = new THREE.Box3().setFromObject(modelo).getSize(new THREE.Vector3());
        modelo.scale.multiplyScalar(LARGO / (Math.max(tam.x, tam.z) || 1));
        modelo.updateMatrixWorld(true);
        const caja = new THREE.Box3().setFromObject(modelo);
        const centro = caja.getCenter(new THREE.Vector3());
        modelo.position.x -= centro.x;
        modelo.position.z -= centro.z;
        modelo.position.y -= caja.min.y;
        modelo.updateMatrixWorld(true);
        altoBase = caja.getSize(new THREE.Vector3()).y;

        // Se pasan las mallas a su grupo conservando la posicion en el mundo.
        const mallas = [];
        modelo.traverse((obj) => { if (obj.isMesh) mallas.push(obj); });
        mallas.forEach((malla) => {
          const material = Array.isArray(malla.material) ? malla.material[0] : malla.material;
          const capa = capaPorMaterial[material?.name] || 'exterior';
          grupos[capa].attach(malla);
          (Array.isArray(malla.material) ? malla.material : [malla.material]).forEach((m) => {
            m.userData.opacidadOriginal = m.opacity;
            m.userData.transparenteOriginal = m.transparent;
            materialesPorCapa[capa].add(m);
          });
        });
        Object.values(grupos).forEach((grupo) => escena.add(grupo));

        anclasRef.current = CAPAS.map((capa) => {
          const cajaCapa = new THREE.Box3().setFromObject(grupos[capa.id]);
          if (cajaCapa.isEmpty()) return null;
          return { id: capa.id, punto: new THREE.Vector3(cajaCapa.min.x, cajaCapa.getCenter(new THREE.Vector3()).y, cajaCapa.max.z) };
        }).filter(Boolean);

        setCargando(false);
        // Arranca armado y se despieza solo, para que se entienda la idea.
        setTimeout(() => { if (!cancelado) setDespiezado(true); }, 700);
      },
      undefined,
      () => { if (!cancelado) { setCargando(false); setError(true); } },
    );

    const total = CAPAS.length - 1;
    const proyeccion = new THREE.Vector3();
    const puntoMovido = new THREE.Vector3();
    let frame = 0;
    let ultimaSeleccion;
    const animar = () => {
      const estado = estadoRef.current;
      estado.actual += (estado.objetivo - estado.actual) * 0.07;
      const t = estado.actual;

      CAPAS.forEach((capa, i) => { grupos[capa.id].position.y = (total - i) * SEPARACION * t; });

      // Encuadre: al despiezar el conjunto crece hacia arriba y la camara se aleja.
      const altoTotal = altoBase + total * SEPARACION * t;
      const objetivoY = altoTotal / 2;
      controles.target.y += (objetivoY - controles.target.y) * 0.1;

      if (estado.seleccionada !== ultimaSeleccion) {
        ultimaSeleccion = estado.seleccionada;
        CAPAS.forEach((capa) => {
          const apagada = ultimaSeleccion && ultimaSeleccion !== capa.id;
          materialesPorCapa[capa.id].forEach((m) => {
            m.transparent = apagada ? true : m.userData.transparenteOriginal;
            m.opacity = apagada ? 0.12 : m.userData.opacidadOriginal;
            m.depthWrite = !apagada;
            m.needsUpdate = true;
          });
        });
      }

      controles.update();
      render3d.render(escena, camara);

      if (anclasRef.current.length) {
        const ancho = contenedor.clientWidth;
        const alto = contenedor.clientHeight;
        const siguiente = {};
        anclasRef.current.forEach(({ id, punto }) => {
          puntoMovido.copy(punto);
          puntoMovido.y += grupos[id].position.y;
          proyeccion.copy(puntoMovido).project(camara);
          siguiente[id] = { x: (proyeccion.x * 0.5 + 0.5) * ancho, y: (-proyeccion.y * 0.5 + 0.5) * alto, visible: proyeccion.z < 1 };
        });
        setPosiciones(siguiente);
      }
      frame = requestAnimationFrame(animar);
    };
    camara.position.set(6.2, 2.6, 7.4);
    controles.target.set(0, 0.8, 0);
    animar();

    const redimensionar = () => {
      camara.aspect = contenedor.clientWidth / contenedor.clientHeight;
      camara.updateProjectionMatrix();
      render3d.setSize(contenedor.clientWidth, contenedor.clientHeight);
    };
    window.addEventListener('resize', redimensionar);

    return () => {
      cancelado = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', redimensionar);
      controles.dispose();
      render3d.dispose();
      if (render3d.domElement.parentNode === contenedor) contenedor.removeChild(render3d.domElement);
    };
    // La escena se arma por modelo (al cambiar de sede); despiece y seleccion van por ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo?.url]);

  const datos = Object.fromEntries(capasData.map((capa) => [capa.id, capa]));

  return (
    <div className="relative h-[620px] w-full overflow-hidden rounded-lg bg-slate-50">
      <div ref={contenedorRef} className="absolute inset-0" />

      {cargando && <div className="absolute inset-0 grid place-items-center text-sm text-slate-500">Cargando modelo…</div>}
      {error && <div className="absolute inset-0 grid place-items-center text-sm text-slate-500">No se pudo cargar el modelo del vehículo.</div>}

      {!cargando && !error && CAPAS.map((capa, i) => {
        const posicion = posiciones[capa.id];
        if (!posicion?.visible) return null;
        const dato = datos[capa.id];
        const activa = seleccionada === capa.id;
        return (
          <button
            key={capa.id}
            type="button"
            onClick={() => onSeleccionar?.(activa ? null : capa.id)}
            style={{ left: posicion.x, top: posicion.y, opacity: despiezado ? 1 : 0 }}
            className="absolute -translate-x-full -translate-y-1/2 pr-3 transition-opacity duration-500 focus:outline-none"
          >
            <span className={`flex items-center gap-2 rounded-lg border bg-white/95 px-2.5 py-1.5 text-left shadow-md ${activa ? 'border-slate-500 ring-2 ring-slate-300' : 'border-slate-200 hover:border-slate-400'}`}>
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: capa.color }}>
                {i + 1}
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-700">{capa.label}</span>
                <span className="block text-[11px] leading-tight text-slate-500">
                  {dato ? `${number.format(dato.ots)} OT · ${money(dato.venta)}` : 'Sin trabajos en el mes'}
                </span>
              </span>
            </span>
          </button>
        );
      })}

      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={() => setDespiezado((valor) => !valor)}
          className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-800"
        >
          {despiezado ? 'Armar' : 'Despiezar'}
        </button>
        {seleccionada && (
          <button type="button" onClick={() => onSeleccionar?.(null)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">
            Ver todo
          </button>
        )}
      </div>
      <p className="absolute bottom-2 left-3 text-[10px] text-slate-400">Arrastra para girar · rueda para acercar · clic en una capa para resaltarla</p>
    </div>
  );
}
