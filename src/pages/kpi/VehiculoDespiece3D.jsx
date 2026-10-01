import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { zonaColor, estadoMuestra, kmText } from './kpiLabels';

// Vista explosionada en 3D.
//
// El vehiculo se construye por codigo con primitivas en vez de cargar un .glb
// porque el despiece necesita que cada pieza medida sea una malla propia: los
// modelos disponibles vienen agrupados por material, no por componente, asi que
// no hay forma de separar "pastilla" o "bateria" de la carroceria.
//
// Cada pieza conoce su posicion de montaje y la direccion hacia la que se
// separa; la animacion solo interpola entre esas dos.

const CHASIS = '#cbd5e1';
const CARROCERIA = '#e2e8f0';
const LLANTA = '#334155';

// pieza: id + geometria + posicion de montaje + direccion de explosion
const PIEZAS = [
  { n: 1, id: 'amortiguador', geo: () => new THREE.CylinderGeometry(0.07, 0.07, 0.55, 16), pos: [-1.38, 0.78, -0.58], dir: [0, 1, -0.6] },
  { n: 2, id: 'disco-freno', geo: () => new THREE.CylinderGeometry(0.34, 0.34, 0.06, 28), pos: [-1.55, 0.42, -0.6], rot: [Math.PI / 2, 0, 0], dir: [0, 0.15, -1] },
  { n: 3, id: 'pastillas-freno', geo: () => new THREE.BoxGeometry(0.24, 0.18, 0.05), pos: [-1.55, 0.72, -0.52], dir: [0, 0.8, -0.9] },
  { n: 4, id: 'rotula', geo: () => new THREE.SphereGeometry(0.11, 18, 14), pos: [-1.62, 0.26, -0.55], dir: [-0.3, -0.9, -0.8] },
  { n: 5, id: 'bomba-agua', geo: () => new THREE.CylinderGeometry(0.17, 0.17, 0.16, 20), pos: [-1.95, 0.86, 0.1], rot: [Math.PI / 2, 0, 0], dir: [-1, 0.5, 0.2] },
  { n: 6, id: 'correa-distribucion', geo: () => new THREE.TorusGeometry(0.22, 0.045, 12, 30), pos: [-2.08, 0.86, 0.34], dir: [-1, 0.75, 0.6] },
  { n: 7, id: 'bateria', geo: () => new THREE.BoxGeometry(0.34, 0.24, 0.22), pos: [-1.62, 0.99, -0.42], dir: [-0.2, 1, -0.7] },
  { n: 8, id: 'embrague', geo: () => new THREE.CylinderGeometry(0.26, 0.26, 0.09, 26), pos: [-0.5, 0.56, 0], rot: [0, 0, Math.PI / 2], dir: [0, -0.7, 1] },
  { n: 9, id: 'bomba-combustible', geo: () => new THREE.CylinderGeometry(0.13, 0.13, 0.32, 18), pos: [0.95, 0.4, 0], dir: [0, -1, 0.7] },
];

const DISTANCIA = 1.25;

function etiquetaSprite(texto, color) {
  // Numero de globo como sprite: se lee siempre de frente, gire como gire.
  const lienzo = document.createElement('canvas');
  lienzo.width = 128;
  lienzo.height = 128;
  const ctx = lienzo.getContext('2d');
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px Segoe UI, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 64, 68);

  const textura = new THREE.CanvasTexture(lienzo);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, depthTest: false }));
  sprite.scale.set(0.3, 0.3, 0.3);
  return sprite;
}

export default function VehiculoDespiece3D({ resumen, muestraMinima, seleccionado, onSeleccionar }) {
  const contenedor = useRef(null);
  const [explotado, setExplotado] = useState(true);
  const [sobre, setSobre] = useState(null);
  const explotadoRef = useRef(explotado);
  const seleccionRef = useRef(seleccionado);

  useEffect(() => { explotadoRef.current = explotado; }, [explotado]);
  useEffect(() => { seleccionRef.current = seleccionado; }, [seleccionado]);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return undefined;

    const porId = Object.fromEntries((resumen || []).map((f) => [f.id, f]));
    const desechables = [];
    const registrar = (obj) => { desechables.push(obj); return obj; };

    // ------------------------------------------------------------- escena
    const escena = new THREE.Scene();
    escena.background = new THREE.Color('#f8fafc');

    const camara = new THREE.PerspectiveCamera(38, nodo.clientWidth / nodo.clientHeight, 0.1, 100);
    camara.position.set(5.2, 3.1, 5.6);

    const render = new THREE.WebGLRenderer({ antialias: true });
    render.setSize(nodo.clientWidth, nodo.clientHeight);
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render.outputColorSpace = THREE.SRGBColorSpace;
    render.shadowMap.enabled = true;
    nodo.appendChild(render.domElement);

    const controles = new OrbitControls(camara, render.domElement);
    controles.enableDamping = true;
    controles.enablePan = false;
    controles.minDistance = 4;
    controles.maxDistance = 14;
    controles.maxPolarAngle = Math.PI / 2.05;
    controles.autoRotate = true;
    controles.autoRotateSpeed = 0.7;
    controles.target.set(0, 0.7, 0);

    escena.add(new THREE.HemisphereLight('#ffffff', '#cbd5e1', 2.1));
    const principal = new THREE.DirectionalLight('#ffffff', 2.6);
    principal.position.set(4, 6, 4);
    principal.castShadow = true;
    escena.add(principal);
    const relleno = new THREE.DirectionalLight('#dbeafe', 1.1);
    relleno.position.set(-5, 2, -4);
    escena.add(relleno);

    const suelo = new THREE.Mesh(
      registrar(new THREE.CircleGeometry(5, 64)),
      registrar(new THREE.ShadowMaterial({ color: '#64748b', opacity: 0.16 })),
    );
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    escena.add(suelo);

    // --------------------------------------------------- carroceria y ruedas
    const cuerpo = new THREE.Group();
    escena.add(cuerpo);

    const bloque = (ancho, alto, fondo, [x, y, z], color, opacidad = 1) => {
      const malla = new THREE.Mesh(
        registrar(new THREE.BoxGeometry(ancho, alto, fondo)),
        registrar(new THREE.MeshStandardMaterial({
          color, roughness: 0.8, metalness: 0.05, transparent: opacidad < 1, opacity: opacidad,
        })),
      );
      malla.position.set(x, y, z);
      malla.castShadow = true;
      malla.receiveShadow = true;
      cuerpo.add(malla);
      return malla;
    };

    bloque(4.9, 0.14, 1.5, [0, 0.46, 0], CHASIS);            // bastidor
    bloque(1.45, 0.34, 1.48, [-1.72, 0.83, 0], CARROCERIA, 0.45);  // capo
    bloque(1.6, 0.72, 1.5, [-0.25, 1.02, 0], CARROCERIA, 0.35);    // cabina
    bloque(1.9, 0.44, 1.5, [1.5, 0.75, 0], CARROCERIA, 0.45);      // tolva

    [[-1.55, -0.82], [-1.55, 0.82], [1.45, -0.82], [1.45, 0.82]].forEach(([x, z]) => {
      const rueda = new THREE.Mesh(
        registrar(new THREE.CylinderGeometry(0.44, 0.44, 0.28, 26)),
        registrar(new THREE.MeshStandardMaterial({ color: LLANTA, roughness: 0.9 })),
      );
      rueda.rotation.x = Math.PI / 2;
      rueda.position.set(x, 0.44, z);
      rueda.castShadow = true;
      cuerpo.add(rueda);
    });

    // ---------------------------------------------------------- piezas medidas
    const piezas = [];
    PIEZAS.forEach((pieza) => {
      const fila = porId[pieza.id];
      if (!fila) return;

      const color = zonaColor(fila.zona);
      const material = registrar(new THREE.MeshStandardMaterial({
        color, roughness: 0.45, metalness: 0.25, emissive: new THREE.Color(color), emissiveIntensity: 0,
      }));
      const malla = new THREE.Mesh(registrar(pieza.geo()), material);
      if (pieza.rot) malla.rotation.set(...pieza.rot);
      malla.castShadow = true;
      malla.userData = { id: pieza.id, label: fila.label, mttf: fila.mttf, n: fila.n };

      const origen = new THREE.Vector3(...pieza.pos);
      const destino = origen.clone().add(
        new THREE.Vector3(...pieza.dir).normalize().multiplyScalar(DISTANCIA),
      );
      malla.position.copy(origen);
      escena.add(malla);

      const globo = etiquetaSprite(String(pieza.n).padStart(2, '0'), color);
      escena.add(globo);
      registrar(globo.material.map);
      registrar(globo.material);

      piezas.push({ ...pieza, malla, material, globo, origen, destino });
    });

    // --------------------------------------------------------- interaccion
    const rayo = new THREE.Raycaster();
    const puntero = new THREE.Vector2();
    let encima = null;

    const aPuntero = (evento) => {
      const caja = render.domElement.getBoundingClientRect();
      puntero.x = ((evento.clientX - caja.left) / caja.width) * 2 - 1;
      puntero.y = -((evento.clientY - caja.top) / caja.height) * 2 + 1;
    };

    const alMover = (evento) => {
      aPuntero(evento);
      rayo.setFromCamera(puntero, camara);
      const tocados = rayo.intersectObjects(piezas.map((p) => p.malla), false);
      encima = tocados.length ? tocados[0].object.userData : null;
      render.domElement.style.cursor = encima ? 'pointer' : 'grab';
      setSobre(encima);
    };

    const alClick = (evento) => {
      aPuntero(evento);
      rayo.setFromCamera(puntero, camara);
      const tocados = rayo.intersectObjects(piezas.map((p) => p.malla), false);
      if (tocados.length) onSeleccionar(tocados[0].object.userData.id);
    };

    render.domElement.addEventListener('pointermove', alMover);
    render.domElement.addEventListener('click', alClick);

    // ------------------------------------------------------------- animacion
    let frame;
    const reloj = new THREE.Clock();

    const bucle = () => {
      frame = requestAnimationFrame(bucle);
      const dt = Math.min(reloj.getDelta(), 0.05);

      piezas.forEach(({ malla, material, globo, origen, destino, id }) => {
        const meta = explotadoRef.current ? destino : origen;
        // Interpolacion exponencial: llega suave y no depende de los FPS.
        malla.position.lerp(meta, 1 - Math.exp(-6 * dt));
        globo.position.copy(malla.position).add(new THREE.Vector3(0, 0.42, 0));
        globo.visible = explotadoRef.current;

        const destacado = seleccionRef.current === id || encima?.id === id;
        material.emissiveIntensity += ((destacado ? 0.45 : 0) - material.emissiveIntensity) * 0.2;
      });

      controles.autoRotate = !encima && !seleccionRef.current;
      controles.update();
      render.render(escena, camara);
    };
    bucle();

    const alRedimensionar = () => {
      if (!nodo.clientWidth) return;
      camara.aspect = nodo.clientWidth / nodo.clientHeight;
      camara.updateProjectionMatrix();
      render.setSize(nodo.clientWidth, nodo.clientHeight);
    };
    window.addEventListener('resize', alRedimensionar);

    // ------------------------------------------------------------- limpieza
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', alRedimensionar);
      render.domElement.removeEventListener('pointermove', alMover);
      render.domElement.removeEventListener('click', alClick);
      controles.dispose();
      desechables.forEach((obj) => obj.dispose?.());
      render.dispose();
      if (render.domElement.parentNode === nodo) nodo.removeChild(render.domElement);
    };
  }, [resumen, onSeleccionar]);

  const filaSobre = sobre && (resumen || []).find((f) => f.id === sobre.id);
  const estado = filaSobre ? estadoMuestra(filaSobre, muestraMinima) : null;

  return (
    <div className="relative">
      <div ref={contenedor} className="h-[520px] w-full rounded-lg bg-slate-50" />

      <button
        type="button"
        onClick={() => setExplotado((valor) => !valor)}
        className="absolute left-3 top-3 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      >
        {explotado ? 'Armar vehículo' : 'Separar piezas'}
      </button>

      {filaSobre && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-xs font-semibold text-slate-800">{filaSobre.label}</p>
          <p className="text-lg font-bold text-slate-950">{kmText(filaSobre.mttf)}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: estado.color }} />
            {filaSobre.n ? `n = ${filaSobre.n}` : '—'}
          </p>
        </div>
      )}

      <p className="absolute bottom-3 left-3 text-[11px] text-slate-400">
        Arrastra para girar · rueda para acercar · clic en una pieza para su detalle
      </p>
    </div>
  );
}
