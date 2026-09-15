import {
  frames,
  type PhotoArea,
} from "./frames.data";


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const MAX_FILE_SIZE =
  15 * 1024 * 1024;

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const DOWNLOAD_FILENAME =
  "retrato-dia-de-muertos.png";

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);


/* =========================================================
   ELEMENTOS DEL DOM
========================================================= */

const canvasElement =
  document.querySelector<HTMLCanvasElement>(
    "#photoCanvas"
  );

const inputElement =
  document.querySelector<HTMLInputElement>(
    "#photoInput"
  );

const photoNameElement =
  document.querySelector<HTMLElement>(
    "#photoName"
  );

const editingControlsElement =
  document.querySelector<HTMLElement>(
    "#editingControls"
  );

const zoomInputElement =
  document.querySelector<HTMLInputElement>(
    "#photoZoom"
  );

const zoomValueElement =
  document.querySelector<HTMLElement>(
    "#zoomValue"
  );

const resetButtonElement =
  document.querySelector<HTMLButtonElement>(
    "#resetPhoto"
  );

const frameSelectorElement =
  document.querySelector<HTMLElement>(
    "#frameSelector"
  );

const framesPrevElement =
  document.querySelector<HTMLButtonElement>(
    "#framesPrev"
  );

const framesNextElement =
  document.querySelector<HTMLButtonElement>(
    "#framesNext"
  );

const downloadButtonElement =
  document.querySelector<HTMLButtonElement>(
    "#downloadPhoto"
  );


/* =========================================================
   VALIDAR ELEMENTOS OBLIGATORIOS
========================================================= */

if (
  !canvasElement ||
  !inputElement ||
  !zoomInputElement ||
  !resetButtonElement ||
  !frameSelectorElement ||
  !framesPrevElement ||
  !framesNextElement ||
  !downloadButtonElement
) {
  throw new Error(
    "No se pudieron encontrar los elementos obligatorios del editor."
  );
}


const context =
  canvasElement.getContext(
    "2d",
    {
      alpha: true,
    }
  );


if (!context) {
  throw new Error(
    "Tu navegador no soporta Canvas 2D."
  );
}


/* =========================================================
   REFERENCIAS VALIDADAS
========================================================= */

const canvas =
  canvasElement;

const input =
  inputElement;

const zoomInput =
  zoomInputElement;

const resetButton =
  resetButtonElement;

const frameSelector =
  frameSelectorElement;

const framesPrev =
  framesPrevElement;

const framesNext =
  framesNextElement;

const downloadButton =
  downloadButtonElement;

const photoName =
  photoNameElement;

const editingControls =
  editingControlsElement;

const zoomValue =
  zoomValueElement;

const ctx =
  context;


/* =========================================================
   ESTADO INICIAL
========================================================= */

downloadButton.disabled =
  true;


/* =========================================================
   OPCIONES DE MARCOS
========================================================= */

const frameOptions =
  Array.from(
    frameSelector.querySelectorAll<HTMLButtonElement>(
      ".photo-editor__frame-option"
    )
  );


if (
  frameOptions.length === 0
) {
  console.warn(
    "No se encontraron opciones de marcos."
  );
}


/* =========================================================
   ÁREA COMPLETA DEL CANVAS
========================================================= */

const FULL_CANVAS_AREA: PhotoArea = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
};


/* =========================================================
   ESTADO DE LA FOTOGRAFÍA
========================================================= */

let currentImage:
  HTMLImageElement | null =
  null;

let baseScale = 1;

let zoom = 1;

let imageCenterX =
  canvas.width / 2;

let imageCenterY =
  canvas.height / 2;


/* =========================================================
   ESTADO DEL MARCO
========================================================= */

let currentFrame:
  HTMLImageElement | null =
  null;

let currentFrameId =
  "none";


/*
 * MÁSCARA ESTRICTA
 *
 * La fotografía nunca se dibuja fuera
 * de esta zona.
 */
let currentPhotoArea:
  PhotoArea = {
    ...FULL_CANVAS_AREA,
  };


/*
 * ÁREA DE ENCUADRE
 *
 * Determina la escala mínima al 100%.
 *
 * Normalmente es más pequeña que
 * currentPhotoArea.
 */
let currentFitArea:
  PhotoArea = {
    ...FULL_CANVAS_AREA,
  };


/* =========================================================
   CACHE DE MARCOS
========================================================= */

const frameCache =
  new Map<
    string,
    HTMLImageElement
  >();


let frameSelectionToken =
  0;


/* =========================================================
   ESTADO DEL DRAG
========================================================= */

let isDragging =
  false;

let dragStartX = 0;
let dragStartY = 0;

let centerStartX = 0;
let centerStartY = 0;


/* =========================================================
   UTILIDADES
========================================================= */

function clamp(
  value: number,
  min: number,
  max: number
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


/* =========================================================
   NORMALIZAR ÁREA
========================================================= */

function normalizeArea(
  area: PhotoArea
): PhotoArea {

  const x =
    Number.isFinite(area.x)
      ? clamp(
          area.x,
          0,
          canvas.width - 1
        )
      : 0;


  const y =
    Number.isFinite(area.y)
      ? clamp(
          area.y,
          0,
          canvas.height - 1
        )
      : 0;


  const maxWidth =
    Math.max(
      1,
      canvas.width - x
    );


  const maxHeight =
    Math.max(
      1,
      canvas.height - y
    );


  const width =
    Number.isFinite(area.width)
      ? clamp(
          area.width,
          1,
          maxWidth
        )
      : maxWidth;


  const height =
    Number.isFinite(area.height)
      ? clamp(
          area.height,
          1,
          maxHeight
        )
      : maxHeight;


  return {
    x,
    y,
    width,
    height,
  };
}


/* =========================================================
   OBTENER CONFIGURACIÓN DEL MARCO
========================================================= */

function getFrameConfiguration(
  frameId: string
) {

  if (
    frameId === "none"
  ) {
    return null;
  }


  return (
    frames.find(
      (frame) =>
        frame.id === frameId
    ) ??
    null
  );
}


/* =========================================================
   ACTUALIZAR ÁREAS
========================================================= */

function updateAreasForFrame(
  frameId: string
): void {

  const frame =
    getFrameConfiguration(
      frameId
    );


  if (!frame) {

    currentPhotoArea = {
      ...FULL_CANVAS_AREA,
    };

    currentFitArea = {
      ...FULL_CANVAS_AREA,
    };


    return;
  }


  currentPhotoArea =
    normalizeArea(
      frame.photoArea
    );


  currentFitArea =
    normalizeArea(
      frame.fitArea
    );
}


/* =========================================================
   PLACEHOLDER
========================================================= */

function drawPlaceholder(): void {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "#201713";


  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "#f5a623";


  ctx.font =
    "600 52px Arial, Helvetica, sans-serif";


  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";


  ctx.fillText(
    "Sube tu fotografía",
    canvas.width / 2,
    canvas.height / 2
  );
}


/* =========================================================
   CALCULAR ESCALA BASE
========================================================= */

function calculateBaseScale(
  image: HTMLImageElement
): number {

  if (
    image.naturalWidth <= 0 ||
    image.naturalHeight <= 0
  ) {
    return 1;
  }


  /*
   * IMPORTANTE:
   *
   * Ya no calculamos la escala utilizando
   * photoArea.
   *
   * Utilizamos fitArea para conseguir
   * un encuadre inicial más abierto.
   */

  const scaleX =
    currentFitArea.width /
    image.naturalWidth;


  const scaleY =
    currentFitArea.height /
    image.naturalHeight;


  return Math.max(
    scaleX,
    scaleY
  );
}


/* =========================================================
   TAMAÑO ACTUAL DE LA IMAGEN
========================================================= */

function getImageDimensions(): {
  width: number;
  height: number;
} {

  if (!currentImage) {

    return {
      width: 0,
      height: 0,
    };

  }


  const scale =
    baseScale *
    zoom;


  return {
    width:
      currentImage.naturalWidth *
      scale,

    height:
      currentImage.naturalHeight *
      scale,
  };
}


/* =========================================================
   CENTRO DEL FIT AREA
========================================================= */

function getFitAreaCenter(): {
  x: number;
  y: number;
} {

  return {
    x:
      currentFitArea.x +
      currentFitArea.width / 2,

    y:
      currentFitArea.y +
      currentFitArea.height / 2,
  };
}


/* =========================================================
   LIMITAR POSICIÓN
========================================================= */

function constrainPosition(): void {

  if (!currentImage) {
    return;
  }


  const {
    width,
    height,
  } =
    getImageDimensions();


  /*
   * Para el movimiento utilizamos FIT AREA.
   *
   * De esta manera el usuario puede desplazar
   * la fotografía mientras la zona importante
   * permanece siempre cubierta.
   *
   * PHOTO AREA continúa siendo únicamente
   * nuestra máscara estricta.
   */

  const areaLeft =
    currentFitArea.x;

  const areaTop =
    currentFitArea.y;

  const areaRight =
    currentFitArea.x +
    currentFitArea.width;

  const areaBottom =
    currentFitArea.y +
    currentFitArea.height;


  const minCenterX =
    areaRight -
    width / 2;


  const maxCenterX =
    areaLeft +
    width / 2;


  const minCenterY =
    areaBottom -
    height / 2;


  const maxCenterY =
    areaTop +
    height / 2;


  const areaCenter =
    getFitAreaCenter();


  if (
    minCenterX <=
    maxCenterX
  ) {

    imageCenterX =
      clamp(
        imageCenterX,
        minCenterX,
        maxCenterX
      );

  } else {

    imageCenterX =
      areaCenter.x;

  }


  if (
    minCenterY <=
    maxCenterY
  ) {

    imageCenterY =
      clamp(
        imageCenterY,
        minCenterY,
        maxCenterY
      );

  } else {

    imageCenterY =
      areaCenter.y;

  }
}


/* =========================================================
   DIBUJAR FOTOGRAFÍA
========================================================= */

function drawPhotoToContext(
  targetContext:
    CanvasRenderingContext2D
): void {

  if (!currentImage) {
    return;
  }


  constrainPosition();


  const {
    width,
    height,
  } =
    getImageDimensions();


  const x =
    imageCenterX -
    width / 2;


  const y =
    imageCenterY -
    height / 2;


  targetContext.save();


  /*
   * PHOTO AREA sigue siendo la máscara.
   *
   * Aunque el usuario mueva la fotografía,
   * ningún pixel puede dibujarse fuera
   * de esta zona.
   */
  targetContext.beginPath();


  targetContext.rect(
    currentPhotoArea.x,
    currentPhotoArea.y,
    currentPhotoArea.width,
    currentPhotoArea.height
  );


  targetContext.clip();


  targetContext.drawImage(
    currentImage,
    x,
    y,
    width,
    height
  );


  targetContext.restore();
}


/* =========================================================
   DIBUJAR MARCO
========================================================= */

function drawFrameToContext(
  targetContext:
    CanvasRenderingContext2D
): void {

  if (!currentFrame) {
    return;
  }


  targetContext.drawImage(
    currentFrame,
    0,
    0,
    canvas.width,
    canvas.height
  );
}


/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function draw(): void {

  if (!currentImage) {

    drawPlaceholder();

    return;

  }


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  drawPhotoToContext(
    ctx
  );


  drawFrameToContext(
    ctx
  );
}


/* =========================================================
   ACTUALIZAR ESCALA
========================================================= */

function updateScaleForCurrentArea(
  preserveZoom = true
): void {

  if (!currentImage) {
    return;
  }


  const previousZoom =
    zoom;


  baseScale =
    calculateBaseScale(
      currentImage
    );


  zoom =
    preserveZoom
      ? clamp(
          previousZoom,
          MIN_ZOOM,
          MAX_ZOOM
        )
      : MIN_ZOOM;


  constrainPosition();
}


/* =========================================================
   CENTRAR FOTOGRAFÍA
========================================================= */

function centerPhoto(): void {

  const center =
    getFitAreaCenter();


  imageCenterX =
    center.x;

  imageCenterY =
    center.y;
}


/* =========================================================
   ACTUALIZAR UI DEL ZOOM
========================================================= */

function updateZoomUI(): void {

  zoomInput.value =
    String(
      zoom
    );


  if (zoomValue) {

    zoomValue.textContent =
      `${Math.round(
        zoom * 100
      )}%`;

  }
}


/* =========================================================
   RESET
========================================================= */

function resetTransform(): void {

  if (!currentImage) {
    return;
  }


  zoom =
    MIN_ZOOM;


  baseScale =
    calculateBaseScale(
      currentImage
    );


  centerPhoto();

  constrainPosition();

  updateZoomUI();

  draw();
}


/* =========================================================
   VALIDAR ARCHIVO
========================================================= */

function validateImageFile(
  file: File
): string | null {

  if (
    !ALLOWED_IMAGE_TYPES.has(
      file.type
    )
  ) {

    return (
      "Formato no permitido. " +
      "Utiliza JPG, PNG o WebP."
    );

  }


  if (
    file.size <= 0
  ) {

    return (
      "El archivo seleccionado está vacío."
    );

  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    return (
      "La fotografía supera el límite de 15 MB."
    );

  }


  return null;
}


/* =========================================================
   ARCHIVO INVÁLIDO
========================================================= */

function handleInvalidFile(
  message: string
): void {

  console.error(
    message
  );


  input.value =
    "";


  /*
   * Si ya existe una fotografía válida,
   * conservamos su posibilidad de descarga.
   */
  if (!currentImage) {

    downloadButton.disabled =
      true;

  }


  if (photoName) {

    photoName.textContent =
      message;

  }
}


/* =========================================================
   CARGAR FOTOGRAFÍA
========================================================= */

input.addEventListener(
  "change",
  () => {

    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    const validationError =
      validateImageFile(
        file
      );


    if (validationError) {

      handleInvalidFile(
        validationError
      );


      return;
    }


    const objectUrl =
      URL.createObjectURL(
        file
      );


    const image =
      new Image();


    image.onload =
      () => {

        if (
          image.naturalWidth <= 0 ||
          image.naturalHeight <= 0
        ) {

          URL.revokeObjectURL(
            objectUrl
          );


          handleInvalidFile(
            "No se pudo obtener el tamaño de la fotografía."
          );


          return;
        }


        currentImage =
          image;


        /*
         * Ya existe una fotografía válida.
         */
        downloadButton.disabled =
          false;


        if (photoName) {

          photoName.textContent =
            file.name;

        }


        resetTransform();


        if (editingControls) {

          editingControls.hidden =
            false;

        }


        canvas.classList.add(
          "is-editable"
        );


        URL.revokeObjectURL(
          objectUrl
        );
      };


    image.onerror =
      () => {

        URL.revokeObjectURL(
          objectUrl
        );


        handleInvalidFile(
          "El archivo no pudo interpretarse como una imagen válida."
        );
      };


    image.src =
      objectUrl;
  }
);


/* =========================================================
   ZOOM
========================================================= */

zoomInput.addEventListener(
  "input",
  () => {

    if (!currentImage) {
      return;
    }


    const requestedZoom =
      Number(
        zoomInput.value
      );


    if (
      !Number.isFinite(
        requestedZoom
      )
    ) {

      console.warn(
        "Se recibió un valor de zoom inválido."
      );


      return;
    }


    zoom =
      clamp(
        requestedZoom,
        MIN_ZOOM,
        MAX_ZOOM
      );


    updateZoomUI();

    draw();
  }
);


/* =========================================================
   COORDENADAS DEL POINTER
========================================================= */

function getCanvasPointerPosition(
  event: PointerEvent
): {
  x: number;
  y: number;
} {

  const rect =
    canvas.getBoundingClientRect();


  if (
    rect.width <= 0 ||
    rect.height <= 0
  ) {

    return {
      x: 0,
      y: 0,
    };

  }


  const scaleX =
    canvas.width /
    rect.width;


  const scaleY =
    canvas.height /
    rect.height;


  return {
    x:
      (
        event.clientX -
        rect.left
      ) *
      scaleX,

    y:
      (
        event.clientY -
        rect.top
      ) *
      scaleY,
  };
}


/* =========================================================
   POINTER DOWN
========================================================= */

canvas.addEventListener(
  "pointerdown",
  (event) => {

    if (!currentImage) {
      return;
    }


    isDragging =
      true;


    try {

      canvas.setPointerCapture(
        event.pointerId
      );

    } catch {

      /*
       * El editor puede seguir funcionando
       * sin pointer capture.
       */

    }


    const pointer =
      getCanvasPointerPosition(
        event
      );


    dragStartX =
      pointer.x;

    dragStartY =
      pointer.y;


    centerStartX =
      imageCenterX;

    centerStartY =
      imageCenterY;


    canvas.classList.add(
      "is-dragging"
    );
  }
);


/* =========================================================
   POINTER MOVE
========================================================= */

canvas.addEventListener(
  "pointermove",
  (event) => {

    if (
      !isDragging ||
      !currentImage
    ) {
      return;
    }


    const pointer =
      getCanvasPointerPosition(
        event
      );


    imageCenterX =
      centerStartX +
      (
        pointer.x -
        dragStartX
      );


    imageCenterY =
      centerStartY +
      (
        pointer.y -
        dragStartY
      );


    draw();
  }
);


/* =========================================================
   FINALIZAR DRAG
========================================================= */

function stopDragging(
  event: PointerEvent
): void {

  if (!isDragging) {
    return;
  }


  isDragging =
    false;


  try {

    if (
      canvas.hasPointerCapture(
        event.pointerId
      )
    ) {

      canvas.releasePointerCapture(
        event.pointerId
      );

    }

  } catch {

    /*
     * El navegador pudo liberar
     * previamente el pointer.
     */

  }


  canvas.classList.remove(
    "is-dragging"
  );
}


/* =========================================================
   POINTER EVENTS
========================================================= */

canvas.addEventListener(
  "pointerup",
  stopDragging
);


canvas.addEventListener(
  "pointercancel",
  stopDragging
);


/* =========================================================
   RESET
========================================================= */

resetButton.addEventListener(
  "click",
  () => {

    resetTransform();

  }
);


/* =========================================================
   CARGAR MARCO
========================================================= */

function loadFrame(
  src: string
): Promise<HTMLImageElement> {

  /*
   * Solamente aceptamos marcos declarados
   * explícitamente en frames.data.ts.
   */
  const allowedFrame =
    frames.some(
      (frame) =>
        frame.src === src
    );


  if (!allowedFrame) {

    return Promise.reject(
      new Error(
        "Se intentó cargar un marco no autorizado."
      )
    );

  }


  const cached =
    frameCache.get(
      src
    );


  if (
    cached &&
    cached.complete &&
    cached.naturalWidth > 0
  ) {

    return Promise.resolve(
      cached
    );

  }


  return new Promise(
    (
      resolve,
      reject
    ) => {

      const image =
        cached ??
        new Image();


      if (!cached) {

        frameCache.set(
          src,
          image
        );

      }


      const handleLoad =
        (): void => {

          if (
            image.naturalWidth <= 0 ||
            image.naturalHeight <= 0
          ) {

            frameCache.delete(
              src
            );


            reject(
              new Error(
                `El marco no contiene una imagen válida: ${src}`
              )
            );


            return;
          }


          resolve(
            image
          );
        };


      const handleError =
        (): void => {

          frameCache.delete(
            src
          );


          reject(
            new Error(
              `No se pudo cargar el marco: ${src}`
            )
          );
        };


      image.addEventListener(
        "load",
        handleLoad,
        {
          once: true,
        }
      );


      image.addEventListener(
        "error",
        handleError,
        {
          once: true,
        }
      );


      if (!cached) {

        image.src =
          src;

      }
    }
  );
}


/* =========================================================
   ACTUALIZAR UI DE MARCOS
========================================================= */

function updateFrameSelectionUI(
  selectedButton:
    HTMLButtonElement
): void {

  for (
    const option
    of frameOptions
  ) {

    const isSelected =
      option ===
      selectedButton;


    option.classList.toggle(
      "is-active",
      isSelected
    );


    option.setAttribute(
      "aria-checked",
      String(
        isSelected
      )
    );
  }
}


/* =========================================================
   CENTRAR OPCIÓN DEL CARRUSEL
========================================================= */

function centerFrameOption(
  option:
    HTMLButtonElement
): void {

  const targetLeft =
    option.offsetLeft -
    frameSelector.clientWidth / 2 +
    option.offsetWidth / 2;


  frameSelector.scrollTo({
    left:
      Math.max(
        0,
        targetLeft
      ),

    behavior:
      "smooth",
  });
}


/* =========================================================
   APLICAR ÁREAS DEL MARCO
========================================================= */

function applyFrameAreas(
  frameId: string
): void {

  updateAreasForFrame(
    frameId
  );


  if (!currentImage) {
    return;
  }


  /*
   * Conservamos el zoom seleccionado.
   *
   * La escala base cambia porque cada
   * marco puede tener un fitArea diferente.
   */
  updateScaleForCurrentArea(
    true
  );


  constrainPosition();
}


/* =========================================================
   SIN MARCO
========================================================= */

function selectNoFrame(): void {

  currentFrame =
    null;

  currentFrameId =
    "none";


  applyFrameAreas(
    "none"
  );


  const noneOption =
    frameOptions.find(
      (option) =>
        option.dataset.frameId ===
        "none"
    );


  if (noneOption) {

    updateFrameSelectionUI(
      noneOption
    );

  }


  draw();
}


/* =========================================================
   SELECCIONAR MARCO
========================================================= */

async function selectFrame(
  option:
    HTMLButtonElement
): Promise<void> {

  const frameId =
    option.dataset.frameId ??
    "none";


  const frameSrc =
    option.dataset.frame ??
    "";


  const selectionToken =
    ++frameSelectionToken;


  updateFrameSelectionUI(
    option
  );


  centerFrameOption(
    option
  );


  /*
   * SIN MARCO
   */
  if (
    frameId === "none" ||
    frameSrc === ""
  ) {

    currentFrame =
      null;

    currentFrameId =
      "none";


    applyFrameAreas(
      "none"
    );


    draw();


    return;
  }


  /*
   * ID y SRC deben coincidir exactamente
   * con uno de nuestros marcos conocidos.
   */
  const frameConfiguration =
    frames.find(
      (frame) =>
        frame.id === frameId &&
        frame.src === frameSrc
    );


  if (!frameConfiguration) {

    console.error(
      "Configuración de marco inválida."
    );


    selectNoFrame();


    return;
  }


  try {

    const image =
      await loadFrame(
        frameSrc
      );


    if (
      selectionToken !==
      frameSelectionToken
    ) {

      return;

    }


    currentFrame =
      image;

    currentFrameId =
      frameId;


    applyFrameAreas(
      currentFrameId
    );


    draw();

  } catch (error) {

    if (
      selectionToken !==
      frameSelectionToken
    ) {

      return;

    }


    console.error(
      "Error al seleccionar el marco:",
      error
    );


    selectNoFrame();
  }
}


/* =========================================================
   EVENTOS DE MARCOS
========================================================= */

for (
  const option
  of frameOptions
) {

  option.addEventListener(
    "click",
    () => {

      void selectFrame(
        option
      );

    }
  );
}


/* =========================================================
   CARRUSEL
========================================================= */

function getCarouselScrollAmount(): number {

  return Math.max(
    120,
    frameSelector.clientWidth *
      0.75
  );
}


framesPrev.addEventListener(
  "click",
  () => {

    frameSelector.scrollBy({
      left:
        -getCarouselScrollAmount(),

      behavior:
        "smooth",
    });

  }
);


framesNext.addEventListener(
  "click",
  () => {

    frameSelector.scrollBy({
      left:
        getCarouselScrollAmount(),

      behavior:
        "smooth",
    });

  }
);


/* =========================================================
   CREAR CANVAS DE EXPORTACIÓN
========================================================= */

function createExportCanvas():
  HTMLCanvasElement | null {

  if (!currentImage) {
    return null;
  }


  const exportCanvas =
    document.createElement(
      "canvas"
    );


  exportCanvas.width =
    canvas.width;

  exportCanvas.height =
    canvas.height;


  const exportContext =
    exportCanvas.getContext(
      "2d",
      {
        alpha: true,
      }
    );


  if (!exportContext) {

    console.error(
      "No se pudo crear el contexto de exportación."
    );


    return null;
  }


  exportContext.clearRect(
    0,
    0,
    exportCanvas.width,
    exportCanvas.height
  );


  /*
   * La misma función que utiliza el preview
   * garantiza que la exportación respete
   * exactamente el encuadre del usuario.
   */
  drawPhotoToContext(
    exportContext
  );


  if (currentFrame) {

    exportContext.drawImage(
      currentFrame,
      0,
      0,
      exportCanvas.width,
      exportCanvas.height
    );

  }


  return exportCanvas;
}


/* =========================================================
   CANVAS → BLOB
========================================================= */

function canvasToBlob(
  sourceCanvas:
    HTMLCanvasElement
): Promise<Blob> {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      try {

        sourceCanvas.toBlob(
          (blob) => {

            if (!blob) {

              reject(
                new Error(
                  "El navegador no pudo generar el archivo PNG."
                )
              );


              return;
            }


            resolve(
              blob
            );

          },
          "image/png"
        );

      } catch (error) {

        reject(
          error
        );

      }
    }
  );
}


/* =========================================================
   DESCARGAR BLOB
========================================================= */

function downloadBlob(
  blob: Blob,
  filename: string
): void {

  const objectUrl =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    objectUrl;

  link.download =
    filename;

  link.rel =
    "noopener";


  document.body.appendChild(
    link
  );


  link.click();

  link.remove();


  window.setTimeout(
    () => {

      URL.revokeObjectURL(
        objectUrl
      );

    },
    1500
  );
}


/* =========================================================
   DESCARGAR
========================================================= */

downloadButton.addEventListener(
  "click",
  async () => {

    if (!currentImage) {

      console.warn(
        "No hay ninguna fotografía para descargar."
      );


      downloadButton.disabled =
        true;


      return;
    }


    if (
      downloadButton.disabled
    ) {

      return;

    }


    downloadButton.disabled =
      true;


    try {

      const exportCanvas =
        createExportCanvas();


      if (!exportCanvas) {

        throw new Error(
          "No se pudo crear la imagen final."
        );

      }


      /*
       * Debemos conservar exactamente
       * 1080 × 1350.
       */
      if (
        exportCanvas.width !==
          canvas.width ||
        exportCanvas.height !==
          canvas.height
      ) {

        throw new Error(
          "Las dimensiones de exportación no son válidas."
        );

      }


      const blob =
        await canvasToBlob(
          exportCanvas
        );


      if (
        blob.size <= 0
      ) {

        throw new Error(
          "El archivo generado está vacío."
        );

      }


      if (
        blob.type !==
        "image/png"
      ) {

        throw new Error(
          "El archivo generado no tiene formato PNG."
        );

      }


      downloadBlob(
        blob,
        DOWNLOAD_FILENAME
      );

    } catch (error) {

      console.error(
        "No se pudo descargar la imagen:",
        error
      );

    } finally {

      downloadButton.disabled =
        false;

    }
  }
);


/* =========================================================
   INICIALIZACIÓN
========================================================= */

updateAreasForFrame(
  "none"
);


drawPlaceholder();