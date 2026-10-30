import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { estadoMuestra, vidaText, zonaColor } from './kpiLabels';
import { agruparPorCapas, CAPAS_GEOMETRICAS, normalizarModelo, pintarCapas } from '../../components/despiece/despieceGeometrico';
import SelectorVehiculo from '../../components/despiece/SelectorVehiculo';
import { capaFijaDe, vehiculoPorDefecto, vehiculoPorId } from '../../config/vehiculosDespiece';

// Vehiculo de referencia con cada repuesto medido señalado sobre el modelo.
//
// El modelo se dibuja en three.js, pero las etiquetas van en HTML por encima:
// se proyecta la posicion 3D de cada anclaje a coordenadas de pantalla en cada
// frame. Asi el texto queda nitido a cualquier zoom y el clic es real, cosa que
// no se consigue con sprites ni con texto dentro de la escena.
//
// Vista explosionada: el vehiculo se parte en capas (carroceria, vidrios,
// habitaculo, motor y bajos, ruedas) que se separan en vertical. Cada repuesto
// viaja con la capa donde esta montado, asi las etiquetas tambien se reparten.

// Un modelo por sede (el que mas entra a ese taller), cambiable desde el visor.
// El catalogo y la rotacion de cada modelo estan en config/vehiculosDespiece.js:
// los anclajes asumen el largo en X con el frente hacia -X.

// Largo al que se normaliza el modelo. Los anclajes estan en fracciones de ese
// volumen, asi que cambiar este numero no los descoloca.
const LARGO = 3.9;

// Anclaje de cada pieza, en fracciones del volumen del vehiculo:
//   x  -0.5 = frente, +0.5 = cola
//   y  -0.5 = suelo,  +0.5 = techo
//   z  lado del vehiculo (positivo = lado hacia la camara)
// Si se cambia el modelo por otro, esto es lo unico que hay que recalibrar.
const ANCLAJES = Object.freeze({
  // vano motor
  'filtro-aire': [-0.44, -0.16, 0.14],
  'filtro-aceite': [-0.40, -0.30, 0.04],
  bujias: [-0.36, -0.14, -0.08],
  'faja-accesorios': [-0.46, -0.24, -0.02],
  bateria: [-0.34, -0.12, 0.24],
  // tren delantero
  amortiguador: [-0.27, -0.26, 0.32],
  'pastillas-freno': [-0.30, -0.42, 0.34],
  // habitaculo y bajos
  'filtro-cabina': [-0.16, -0.08, 0.18],
  plumillas: [-0.20, 0.06, 0.10],
  'filtro-combustible': [0.06, -0.40, 0.14],
  // tren posterior
  'zapatas-freno': [0.30, -0.42, 0.32],
});

// Capa (ver despieceGeometrico.js) con la que se mueve cada repuesto al despiezar.
const CAPA_DE_PIEZA = Object.freeze({
  'filtro-aire': 'chasis',
  'filtro-aceite': 'chasis',
  bujias: 'chasis',
  'faja-accesorios': 'chasis',
  bateria: 'chasis',
  'filtro-combustible': 'chasis',
  amortiguador: 'ruedas',
  'pastillas-freno': 'ruedas',
  'zapatas-freno': 'ruedas',
  'filtro-cabina': 'interior',
  plumillas: 'vidrios',
});

// Distancia vertical entre capas con el vehiculo despiezado.
const SEPARACION = 0.55;

export default function VehiculoDespiece({
  resumen, muestraMinima, seleccionado, onSeleccionar, local,
}) {
  // Si se elige otro vehiculo, vale hasta cambiar de sede.
  const [vehiculoElegido, setVehiculoElegido] = useState(null);
  useEffect(() => { setVehiculoElegido(null); }, [local]);
  const vehiculo = vehiculoElegido ? vehiculoPorId(vehiculoElegido) : vehiculoPorDefecto('kpi', local);
  const { url, rotacionY } = vehiculo;
  const contenedorRef = useRef(null);
  const marcadoresRef = useRef([]);
  const estadoRef = useRef({ objetivo: 0, actual: 0, seleccionado: null });
  const [despiezado, setDespiezado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  // Posicion en pantalla de cada etiqueta, recalculada en cada frame.
  const [posiciones, setPosiciones] = useState({});

  const piezas = useMemo(
    () => (resumen || []).filter((fila) => ANCLAJES[fila.id]),
    [resumen],
  );

  useEffect(() => { estadoRef.current.objetivo = despiezado ? 1 : 0; }, [despiezado]);
  useEffect(() => { estadoRef.current.seleccionado = seleccionado || null; }, [seleccionado]);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return undefined;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color('#f8fafc');

    const camara = new THREE.PerspectiveCamera(
      34,
      contenedor.clientWidth / contenedor.clientHeight,
      0.1,
      100,
    );
    camara.position.set(6.4, 3.0, 6.8);

    const render3d = new THREE.WebGLRenderer({ antialias: true });
    render3d.setSize(contenedor.clientWidth, contenedor.clientHeight);
    render3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render3d.outputColorSpace = THREE.SRGBColorSpace;
    contenedor.appendChild(render3d.domElement);

    const controles = new OrbitControls(camara, render3d.domElement);
    controles.enableDamping = true;
    controles.enablePan = false;
    controles.minDistance = 3.4;
    controles.maxDistance = 14;
    // No se baja de la horizontal: por debajo del piso no hay nada que ver.
    controles.maxPolarAngle = Math.PI / 2.05;
    controles.target.set(0, 0.7, 0);

    escena.add(new THREE.HemisphereLight('#ffffff', '#cbd5e1', 2.2));
    const principal = new THREE.DirectionalLight('#ffffff', 2.6);
    principal.position.set(3, 5, 4);
    escena.add(principal);
    const relleno = new THREE.DirectionalLight('#dbeafe', 1.2);
    relleno.position.set(-4, 2, -3);
    escena.add(relleno);

    const piso = new THREE.Mesh(
      new THREE.CircleGeometry(3.4, 64),
      new THREE.MeshBasicMaterial({ color: '#e2e8f0' }),
    );
    piso.rotation.x = -Math.PI / 2;
    escena.add(piso);

    let cancelado = false;
    let grupos = null;
    // Nivel de apilado de cada capa; solo cuentan las que tienen piezas (el L200
    // no trae habitaculo ni motor y no debe quedar un hueco en el despiece).
    let niveles = {};
    let totalNiveles = 0;
    const materialesPorCapa = Object.fromEntries(CAPAS_GEOMETRICAS.map((capa) => [capa.id, new Set()]));
    let altoBase = 1.5;
    marcadoresRef.current = [];
    estadoRef.current.actual = 0;
    setCargando(true);
    setError(false);
    setDespiezado(false);
    new GLTFLoader().load(
      url,
      (gltf) => {
        if (cancelado) return;
        const modelo = gltf.scene;
        const cajaFinal = normalizarModelo(modelo, { largo: LARGO, rotacionY });
        escena.add(modelo);
        const dim = cajaFinal.getSize(new THREE.Vector3());
        const centro = cajaFinal.getCenter(new THREE.Vector3());
        altoBase = dim.y;

        // Las mallas pasan a un grupo por capa; mover el grupo en Y es el despiece.
        const mallas = [];
        modelo.traverse((obj) => { if (obj.isMesh) mallas.push(obj); });
        grupos = agruparPorCapas(mallas, cajaFinal, { capaFija: capaFijaDe(vehiculo) });
        Object.entries(grupos).forEach(([capa, grupo]) => {
          escena.add(grupo);
          grupo.traverse((obj) => {
            if (!obj.isMesh) return;
            // Copia propia del material: al apagar una capa no se apaga otra que lo comparta.
            obj.material = Array.isArray(obj.material) ? obj.material.map((m) => m.clone()) : obj.material.clone();
            (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => {
              m.userData.opacidadOriginal = m.opacity;
              m.userData.transparenteOriginal = m.transparent;
              materialesPorCapa[capa].add(m);
            });
          });
        });
        pintarCapas(grupos, vehiculo.colores);
        escena.remove(modelo);
        const conPiezas = CAPAS_GEOMETRICAS.filter((capa) => grupos[capa.id].children.length);
        totalNiveles = Math.max(conPiezas.length - 1, 0);
        niveles = Object.fromEntries(conPiezas.map((capa, i) => [capa.id, totalNiveles - i]));
        // La camara se aleja segun lo alto que queda el despiece.
        const distancia = Math.max(10, (altoBase + totalNiveles * SEPARACION) * 2.4);
        camara.position.copy(new THREE.Vector3(6.4, 3.0, 6.8).normalize().multiplyScalar(distancia));
        // Un repuesto cuya capa no existe en el modelo viaja con la carroceria.
        const capaDeAnclaje = (id) => (niveles[CAPA_DE_PIEZA[id]] !== undefined ? CAPA_DE_PIEZA[id] : 'carroceria');

        marcadoresRef.current = Object.entries(ANCLAJES).map(([id, [fx, fy, fz]]) => ({
          id,
          capa: capaDeAnclaje(id),
          punto: new THREE.Vector3(
            centro.x + fx * dim.x,
            centro.y + fy * dim.y,
            centro.z + fz * dim.z,
          ),
        }));

        controles.target.copy(centro);
        setCargando(false);
        // Arranca armado y se despieza solo, para que se entienda la idea.
        setTimeout(() => { if (!cancelado) setDespiezado(true); }, 700);
      },
      undefined,
      () => {
        if (!cancelado) {
          setCargando(false);
          setError(true);
        }
      },
    );

    const proyeccion = new THREE.Vector3();
    let ultimaCapaActiva;
    let frame = 0;
    const animar = () => {
      const estado = estadoRef.current;
      estado.actual += (estado.objetivo - estado.actual) * 0.07;
      if (grupos) {
        CAPAS_GEOMETRICAS.forEach((capa) => { grupos[capa.id].position.y = (niveles[capa.id] || 0) * SEPARACION * estado.actual; });
        // Al despiezar el conjunto crece hacia arriba: el encuadre lo acompaña.
        const objetivoY = (altoBase + totalNiveles * SEPARACION * estado.actual) / 2;
        controles.target.y += (objetivoY - controles.target.y) * 0.1;

        // Con un repuesto elegido, las demas capas quedan translucidas.
        const capaActiva = estado.seleccionado ? CAPA_DE_PIEZA[estado.seleccionado] || null : null;
        if (capaActiva !== ultimaCapaActiva) {
          ultimaCapaActiva = capaActiva;
          CAPAS_GEOMETRICAS.forEach((capa) => {
            const apagada = capaActiva && capaActiva !== capa.id;
            materialesPorCapa[capa.id].forEach((m) => {
              m.transparent = apagada ? true : m.userData.transparenteOriginal;
              m.opacity = apagada ? 0.15 : m.userData.opacidadOriginal;
              m.depthWrite = !apagada;
              m.needsUpdate = true;
            });
          });
        }
      }
      controles.update();
      render3d.render(escena, camara);

      // Las etiquetas siguen al modelo: se proyecta cada anclaje a pixeles.
      if (marcadoresRef.current.length) {
        const ancho = contenedor.clientWidth;
        const alto = contenedor.clientHeight;
        const siguiente = {};
        marcadoresRef.current.forEach(({ id, capa, punto }) => {
          proyeccion.copy(punto);
          if (grupos) proyeccion.y += grupos[capa].position.y;
          proyeccion.project(camara);
          siguiente[id] = {
            x: (proyeccion.x * 0.5 + 0.5) * ancho,
            y: (-proyeccion.y * 0.5 + 0.5) * alto,
            // z fuera de rango significa que quedo detras de la camara.
            visible: proyeccion.z < 1,
          };
        });
        setPosiciones(siguiente);
      }
      frame = requestAnimationFrame(animar);
    };
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
      if (render3d.domElement.parentNode === contenedor) {
        contenedor.removeChild(render3d.domElement);
      }
    };
    // La escena se arma por vehiculo (url); despiece y seleccion van por ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, rotacionY]);

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-lg bg-slate-50">
      <div ref={contenedorRef} className="absolute inset-0" />

      {cargando ? (
        <div className="absolute inset-0 grid place-items-center text-sm text-slate-500">
          Cargando modelo…
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-slate-500">
          No se pudo cargar el modelo del vehículo.
        </div>
      ) : null}

      {/* Etiquetas en HTML sobre el canvas: texto nitido y clic real. */}
      {!cargando && !error && piezas.map((fila) => {
        const posicion = posiciones[fila.id];
        if (!posicion?.visible) return null;
        const color = zonaColor(fila.zona);
        const estado = estadoMuestra(fila, muestraMinima);
        const activo = seleccionado === fila.id;

        return (
          <button
            key={fila.id}
            type="button"
            onClick={() => onSeleccionar(fila.id)}
            style={{ left: posicion.x, top: posicion.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            title={fila.label}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={`block shrink-0 rounded-full ring-2 ring-white transition-all ${activo ? 'h-5 w-5' : 'h-3.5 w-3.5'}`}
                style={{ backgroundColor: color }}
              />
              <span
                className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-left shadow-md transition ${
                  activo ? 'border-slate-400 bg-white' : 'border-slate-200 bg-white/90 hover:bg-white'
                }`}
              >
                <span className="block text-[11px] font-semibold leading-tight text-slate-600">
                  {fila.label}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: estado.color }}
                  />
                  <span className="text-[15px] font-bold leading-tight text-slate-950">
                    {vidaText(fila.km?.kmMediana, fila.km?.curva)}
                  </span>
                </span>
              </span>
            </span>
          </button>
        );
      })}

      <SelectorVehiculo value={vehiculo.id} onChange={setVehiculoElegido} className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 shadow-sm" />

      {!cargando && !error ? (
        <button
          type="button"
          onClick={() => setDespiezado((valor) => !valor)}
          className="absolute right-3 top-3 rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-800"
        >
          {despiezado ? 'Armar' : 'Despiezar'}
        </button>
      ) : null}

      <p className="absolute bottom-2 left-3 text-[10px] text-slate-400">
        Arrastra para girar · rueda para acercar · clic en un repuesto para resaltar su capa
      </p>
      <p className="absolute bottom-2 right-3 text-[10px] text-slate-400">
        Modelo 3D: {vehiculo.autor} (Sketchfab, CC-BY)
      </p>
    </div>
  );
}
