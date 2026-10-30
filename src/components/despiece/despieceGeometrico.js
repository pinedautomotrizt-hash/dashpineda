import * as THREE from 'three';

// Despiece por geometria para modelos que no traen las piezas separadas por
// material (el L200 es casi una sola malla; el Kia o el Triton tienen
// materiales sin nombre util). Cada malla se parte en sus piezas sueltas
// (componentes conexas: lo que no comparte vertices es otra pieza) y cada pieza
// se asigna a una capa segun donde esta dentro del vehiculo.
//
// Lo usan el KPI de repuestos y Planchado y Pintura; los ids de capa son los
// mismos en los dos modulos.

// De arriba hacia abajo: es el orden en que quedan apiladas al despiezar.
export const CAPAS_GEOMETRICAS = Object.freeze([
  { id: 'carroceria', label: 'Carrocería' },
  { id: 'vidrios', label: 'Vidrios' },
  { id: 'interior', label: 'Habitáculo' },
  { id: 'chasis', label: 'Motor y bajos' },
  { id: 'ruedas', label: 'Ruedas y frenos' },
]);

// Deja el modelo con el largo en X, del tamaño pedido, centrado en X/Z y
// apoyado en el piso (y = 0). Sin rotacionY, gira solo si el largo viene en Z.
// Devuelve la caja final. El orden importa: Box3 usa la matriz actual, asi que
// se rota antes de medir y se escala antes de centrar.
export function normalizarModelo(raiz, { largo, rotacionY } = {}) {
  raiz.updateMatrixWorld(true);
  if (rotacionY === undefined) {
    const crudo = new THREE.Box3().setFromObject(raiz).getSize(new THREE.Vector3());
    raiz.rotation.y = crudo.z > crudo.x ? Math.PI / 2 : 0;
  } else {
    raiz.rotation.y = rotacionY;
  }
  raiz.updateMatrixWorld(true);
  const tam = new THREE.Box3().setFromObject(raiz).getSize(new THREE.Vector3());
  raiz.scale.multiplyScalar(largo / (Math.max(tam.x, tam.z) || 1));
  raiz.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(raiz);
  const centro = caja.getCenter(new THREE.Vector3());
  raiz.position.x -= centro.x;
  raiz.position.z -= centro.z;
  raiz.position.y -= caja.min.y;
  raiz.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(raiz);
}

// Une los vertices que comparten posicion (los modelos duplican vertices en las
// costuras de UV) y devuelve, por triangulo, el id de la pieza a la que pertenece.
function piezasPorTriangulo(geometria) {
  const posicion = geometria.attributes.position;
  const indice = geometria.index;
  const totalTriangulos = (indice ? indice.count : posicion.count) / 3;
  const verticeDe = (k) => (indice ? indice.getX(k) : k);

  const unico = new Int32Array(posicion.count);
  const vistos = new Map();
  for (let v = 0; v < posicion.count; v += 1) {
    const clave = `${Math.round(posicion.getX(v) * 1e5)},${Math.round(posicion.getY(v) * 1e5)},${Math.round(posicion.getZ(v) * 1e5)}`;
    let id = vistos.get(clave);
    if (id === undefined) { id = vistos.size; vistos.set(clave, id); }
    unico[v] = id;
  }

  const padre = new Int32Array(vistos.size);
  for (let i = 0; i < padre.length; i += 1) padre[i] = i;
  const raiz = (x) => {
    let r = x;
    while (padre[r] !== r) { padre[r] = padre[padre[r]]; r = padre[r]; }
    return r;
  };
  for (let t = 0; t < totalTriangulos; t += 1) {
    const a = raiz(unico[verticeDe(t * 3)]);
    const b = raiz(unico[verticeDe(t * 3 + 1)]);
    const c = raiz(unico[verticeDe(t * 3 + 2)]);
    padre[b] = a;
    padre[raiz(c)] = a;
  }
  const pieza = new Int32Array(totalTriangulos);
  for (let t = 0; t < totalTriangulos; t += 1) pieza[t] = raiz(unico[verticeDe(t * 3)]);
  return { pieza, totalTriangulos, verticeDe };
}

function esVidrio(material) {
  if (!material) return false;
  if (/glass|vidrio|window|cristal/i.test(material.name || '')) return true;
  return material.transparent && material.opacity < 0.9;
}

// Capa de una pieza segun su caja (ya en coordenadas del vehiculo apoyado en el
// piso y centrado en X/Z). Los umbrales son fracciones del vehiculo, asi que no
// dependen de la escala del modelo.
function capaDeCaja(caja, vehiculo) {
  const largo = vehiculo.max.x - vehiculo.min.x;
  const ancho = vehiculo.max.z - vehiculo.min.z;
  const alto = vehiculo.max.y - vehiculo.min.y;
  const tam = caja.getSize(new THREE.Vector3());
  const piso = (caja.min.y - vehiculo.min.y) / alto;
  const techo = (caja.max.y - vehiculo.min.y) / alto;

  // Llantas, aros, discos: tocan el piso, no pasan de media altura y son
  // cortas respecto del largo del vehiculo.
  if (piso < 0.12 && techo < 0.55 && tam.x < largo * 0.3 && tam.y > alto * 0.12) return 'ruedas';
  // Bajos: todo lo que queda por debajo del tercio inferior.
  if (techo < 0.36) return 'chasis';
  // Habitaculo: piezas metidas por dentro de la silueta (asientos, tablero,
  // paneles). Lo que toca el borde exterior es carroceria.
  const margenX = largo * 0.06;
  const margenZ = ancho * 0.08;
  const dentro = caja.min.x > vehiculo.min.x + margenX && caja.max.x < vehiculo.max.x - margenX
    && caja.min.z > vehiculo.min.z + margenZ && caja.max.z < vehiculo.max.z - margenZ
    && piso > 0.18 && techo < 0.93;
  if (dentro) return 'interior';
  return 'carroceria';
}

// Recibe las mallas del modelo (ya normalizado) y devuelve un grupo por capa
// con mallas nuevas: cada malla original se parte en tantas como capas toquen
// sus piezas. Las mallas nuevas comparten atributos con la original.
//
// capaFija(malla, material) permite fijar la capa de una malla (por ejemplo por
// el nombre de su material); si devuelve null/undefined la malla se reparte por
// posicion. capas son los ids de grupo a crear (deben incluir los geometricos).
export function agruparPorCapas(mallas, cajaVehiculo, { capas, capaFija } = {}) {
  const ids = capas || CAPAS_GEOMETRICAS.map((capa) => capa.id);
  const grupos = Object.fromEntries(ids.map((id) => [id, new THREE.Group()]));
  const v = new THREE.Vector3();

  mallas.forEach((malla) => {
    const material = Array.isArray(malla.material) ? malla.material[0] : malla.material;
    malla.updateWorldMatrix(true, false);
    const fija = capaFija?.(malla, material);
    if (fija && grupos[fija]) {
      grupos[fija].attach(malla);
      return;
    }
    // Las plumillas van con el parabrisas aunque por posicion parezcan de adentro.
    if (esVidrio(material) || /wiper|plumilla|limpia/i.test(malla.name || '')) {
      grupos.vidrios.attach(malla);
      return;
    }
    const geometria = malla.geometry;
    const { pieza, totalTriangulos, verticeDe } = piezasPorTriangulo(geometria);
    const posicion = geometria.attributes.position;

    // Caja de cada pieza en coordenadas del mundo.
    const cajas = new Map();
    for (let t = 0; t < totalTriangulos; t += 1) {
      let caja = cajas.get(pieza[t]);
      if (!caja) { caja = new THREE.Box3(); cajas.set(pieza[t], caja); }
      for (let k = 0; k < 3; k += 1) {
        v.fromBufferAttribute(posicion, verticeDe(t * 3 + k)).applyMatrix4(malla.matrixWorld);
        caja.expandByPoint(v);
      }
    }
    const capaDePieza = new Map();
    cajas.forEach((caja, id) => capaDePieza.set(id, capaDeCaja(caja, cajaVehiculo)));

    const indicesPorCapa = {};
    for (let t = 0; t < totalTriangulos; t += 1) {
      const capa = capaDePieza.get(pieza[t]);
      (indicesPorCapa[capa] ||= []).push(verticeDe(t * 3), verticeDe(t * 3 + 1), verticeDe(t * 3 + 2));
    }
    const capas = Object.keys(indicesPorCapa);
    if (capas.length === 1) {
      grupos[capas[0]].attach(malla);
      return;
    }
    capas.forEach((capa) => {
      const parte = new THREE.BufferGeometry();
      Object.entries(geometria.attributes).forEach(([nombre, atributo]) => parte.setAttribute(nombre, atributo));
      parte.setIndex(indicesPorCapa[capa]);
      const nueva = new THREE.Mesh(parte, malla.material);
      malla.matrixWorld.decompose(nueva.position, nueva.quaternion, nueva.scale);
      grupos[capa].attach(nueva);
    });
    malla.removeFromParent();
  });

  return grupos;
}

// Para modelos sin color (el Triton viene todo blanco): tiñe cada capa. Usar
// despues de clonar los materiales, para no teñir otra capa que los comparta.
export function pintarCapas(grupos, colores) {
  if (!colores) return;
  Object.entries(colores).forEach(([capa, color]) => {
    grupos[capa]?.traverse((obj) => {
      if (!obj.isMesh) return;
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.color?.set(color));
    });
  });
}
