import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { estadoMuestra, vidaText, zonaColor } from './kpiLabels';

// Vehiculo de referencia con cada repuesto medido señalado sobre el modelo.
//
// El modelo se dibuja en three.js, pero las etiquetas van en HTML por encima:
// se proyecta la posicion 3D de cada anclaje a coordenadas de pantalla en cada
// frame. Asi el texto queda nitido a cualquier zoom y el clic es real, cosa que
// no se consigue con sprites ni con texto dentro de la escena.

// Un modelo por sede: cada taller atiende un parque distinto y el dibujo debe
// parecerse a lo que ahi se ve entrar.
//
// rotacionY alinea el eje largo del modelo con X, que es como estan definidos
// los anclajes. El Kia ya viene con el largo en X (rotacion 0); el L200 lo trae
// en Z, asi que hay que girarlo un cuarto de vuelta. Si un modelo apareciera
// mirando al lado contrario, se le suma Math.PI.
const MODELOS = Object.freeze({
  'Pineda Trujillo': {
    url: '/assets/1978-2006_mitsubishi_l200_red_offroader_v4.glb',
    rotacionY: -Math.PI / 2,
  },
  'Pineda Callao': {
    url: '/assets/modelo_camioneta.glb',
    rotacionY: 0,
  },
});

const MODELO_POR_DEFECTO = MODELOS['Pineda Callao'];

function modeloDe(local) {
  return MODELOS[local] || MODELO_POR_DEFECTO;
}

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

export default function VehiculoDespiece({
  resumen, muestraMinima, seleccionado, onSeleccionar, local,
}) {
  const { url, rotacionY } = modeloDe(local);
  const contenedorRef = useRef(null);
  const marcadoresRef = useRef([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  // Posicion en pantalla de cada etiqueta, recalculada en cada frame.
  const [posiciones, setPosiciones] = useState({});

  const piezas = useMemo(
    () => (resumen || []).filter((fila) => ANCLAJES[fila.id]),
    [resumen],
  );

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
    camara.position.set(4.4, 1.9, 4.6);

    const render3d = new THREE.WebGLRenderer({ antialias: true });
    render3d.setSize(contenedor.clientWidth, contenedor.clientHeight);
    render3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render3d.outputColorSpace = THREE.SRGBColorSpace;
    contenedor.appendChild(render3d.domElement);

    const controles = new OrbitControls(camara, render3d.domElement);
    controles.enableDamping = true;
    controles.enablePan = false;
    controles.minDistance = 3.4;
    controles.maxDistance = 9;
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
    marcadoresRef.current = [];
    setCargando(true);
    setError(false);
    new GLTFLoader().load(
      url,
      (gltf) => {
        if (cancelado) return;
        const modelo = gltf.scene;

        // La rotacion va antes de medir: Box3 usa la matriz actual, asi que
        // girar despues dejaria el encuadre y los anclajes calculados sobre el
        // volumen sin rotar.
        modelo.rotation.y = rotacionY;
        modelo.updateMatrixWorld(true);

        // Primero escalar y recien despues centrar: position no se reescala con
        // el modelo, asi que centrar antes deja el offset sin ajustar.
        const caja = new THREE.Box3().setFromObject(modelo);
        const tamanio = caja.getSize(new THREE.Vector3());
        const escala = LARGO / (Math.max(tamanio.x, tamanio.y, tamanio.z) || 1);
        modelo.scale.setScalar(escala);
        modelo.updateMatrixWorld(true);

        const cajaEscalada = new THREE.Box3().setFromObject(modelo);
        modelo.position.sub(cajaEscalada.getCenter(new THREE.Vector3()));
        escena.add(modelo);

        // Apoyarlo en el piso en vez de dejarlo flotando.
        modelo.updateMatrixWorld(true);
        const apoyado = new THREE.Box3().setFromObject(modelo);
        modelo.position.y -= apoyado.min.y;

        modelo.updateMatrixWorld(true);
        const cajaFinal = new THREE.Box3().setFromObject(modelo);
        const dim = cajaFinal.getSize(new THREE.Vector3());
        const centro = cajaFinal.getCenter(new THREE.Vector3());
        marcadoresRef.current = Object.entries(ANCLAJES).map(([id, [fx, fy, fz]]) => ({
          id,
          punto: new THREE.Vector3(
            centro.x + fx * dim.x,
            centro.y + fy * dim.y,
            centro.z + fz * dim.z,
          ),
        }));

        controles.target.copy(centro);
        setCargando(false);
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
    let frame = 0;
    const animar = () => {
      controles.update();
      render3d.render(escena, camara);

      // Las etiquetas siguen al modelo: se proyecta cada anclaje a pixeles.
      if (marcadoresRef.current.length) {
        const ancho = contenedor.clientWidth;
        const alto = contenedor.clientHeight;
        const siguiente = {};
        marcadoresRef.current.forEach(({ id, punto }) => {
          proyeccion.copy(punto).project(camara);
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
  }, [url, rotacionY]);

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-lg bg-slate-50">
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

      <p className="absolute bottom-2 left-3 text-[10px] text-slate-400">
        Arrastra para girar · rueda para acercar
      </p>
    </div>
  );
}
