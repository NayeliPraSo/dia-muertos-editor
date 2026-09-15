/* =========================================================
   TIPOS
========================================================= */

export interface PhotoArea {
  x: number;
  y: number;
  width: number;
  height: number;
}


export interface PhotoFrame {
  id: string;
  name: string;
  src: string;

  /*
   * Máscara estricta.
   *
   * La fotografía jamás puede dibujarse
   * fuera de esta zona.
   */
  photoArea: PhotoArea;

  /*
   * Área utilizada para calcular el
   * encuadre mínimo al 100%.
   *
   * Una fitArea más pequeña produce
   * un encuadre más abierto.
   */
  fitArea: PhotoArea;
}
const BASE_URL = import.meta.env.BASE_URL;

/* =========================================================
   MARCOS
========================================================= */

export const frames: PhotoFrame[] = [

  /* =======================================================
     MARCO 1
     Catrín lateral
  ======================================================== */

  {
    id: "frame-1",

    name: "Marco 1",

    src: `${BASE_URL}frames/Marco-1.png`,

    photoArea: {
      x: 70,
      y: 90,
      width: 940,
      height: 1160,
    },

    fitArea: {
      x: 145,
      y: 175,
      width: 790,
      height: 980,
    },
  },


  /* =======================================================
     MARCO 2
     Catrina derecha
  ======================================================== */

  {
    id: "frame-2",

    name: "Marco 2",

    src: `${BASE_URL}frames/Marco-2.png`,

    photoArea: {
      x: 80,
      y: 120,
      width: 920,
      height: 1080,
    },

    fitArea: {
      x: 155,
      y: 200,
      width: 770,
      height: 900,
    },
  },


  /* =======================================================
     MARCO 3
     Papel picado lateral
  ======================================================== */

  {
    id: "frame-3",

    name: "Marco 3",

    src: `${BASE_URL}frames/Marco-3.png`,

    photoArea: {
      x: 85,
      y: 135,
      width: 910,
      height: 1060,
    },

    fitArea: {
      x: 145,
      y: 200,
      width: 790,
      height: 910,
    },
  },


  /* =======================================================
     MARCO 4
     Pan de muerto
  ======================================================== */

  {
    id: "frame-4",

    name: "Marco 4",

    src: `${BASE_URL}frames/Marco-4.png`,

    photoArea: {
      x: 135,
      y: 120,
      width: 810,
      height: 1080,
    },

    fitArea: {
      x: 180,
      y: 175,
      width: 720,
      height: 950,
    },
  },


  /* =======================================================
     MARCO 5
     Papel picado superior
  ======================================================== */

  {
    id: "frame-5",

    name: "Marco 5",

    src: `${BASE_URL}frames/Marco-5.png`,

    photoArea: {
      x: 115,
      y: 125,
      width: 790,
      height: 1060,
    },

    fitArea: {
      x: 170,
      y: 195,
      width: 680,
      height: 910,
    },
  },


  /* =======================================================
     MARCO 6
     Flores y calaveras
  ======================================================== */

  {
    id: "frame-6",

    name: "Marco 6",

    src: `${BASE_URL}frames/Marco-6.png`,

    photoArea: {
      x: 165,
      y: 120,
      width: 775,
      height: 1080,
    },

    fitArea: {
      x: 205,
      y: 175,
      width: 695,
      height: 950,
    },
  },
];