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
   CONFIGURACIÓN DE LA PLACA
========================================================= */

const NAMEPLATE_SRC =
  `${import.meta.env.BASE_URL}nameplates/placa.png`;

const NAME_MAX_LENGTH =
  35;


/*
 * Tamaño máximo y mínimo del texto
 * dentro de la placa.
 */
const NAME_FONT_MAX_SIZE =
  54;

const NAME_FONT_MIN_SIZE =
  28;


/*
 * Posición inicial de la placa.
 *
 * Posteriormente podremos moverla
 * individualmente según cada marco.
 */
const NAMEPLATE_CENTER_X =
  540;

const NAMEPLATE_CENTER_Y =
  1260;


/*
 * Ancho máximo que ocupará la placa
 * dentro del canvas 1080 × 1350.
 */
const NAMEPLATE_MAX_WIDTH =
  720;


/*
 * Porcentaje del ancho interno de la
 * placa que puede ocupar el texto.
 */
const NAME_TEXT_WIDTH_RATIO =
  0.72;


/*
 * Tiempo mínimo que mostramos el estado
 * "Aplicando marco...".
 */
const MIN_FRAME_LOADING_TIME =
  300;


/*
 * Tiempo que permanece visible la ayuda
 * de "Arrastra para ajustar tu foto".
 */
const CANVAS_HELP_DURATION =
  4500;


/*
 * Duración de la animación de salida
 * definida en CSS.
 */
const CANVAS_HELP_HIDE_DURATION =
  300;


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
   ELEMENTOS DEL NOMBRE
========================================================= */

const showNameElement =
  document.querySelector<HTMLInputElement>(
    "#showName"
  );

const nameControlsElement =
  document.querySelector<HTMLElement>(
    "#nameControls"
  );

const photoNameTextElement =
  document.querySelector<HTMLInputElement>(
    "#photoNameText"
  );

const nameCounterElement =
  document.querySelector<HTMLElement>(
    "#nameCounter"
  );


/* =========================================================
   ELEMENTOS DE ESTADO
========================================================= */

const canvasHelpElement =
  document.querySelector<HTMLElement>(
    "#canvasHelp"
  );

const frameLoadingElement =
  document.querySelector<HTMLElement>(
    "#frameLoading"
  );

const frameLoadingTextElement =
  document.querySelector<HTMLElement>(
    "#frameLoadingText"
  );

const downloadSpinnerElement =
  document.querySelector<HTMLElement>(
    "#downloadSpinner"
  );

const downloadTextElement =
  document.querySelector<HTMLElement>(
    "#downloadText"
  );


/* =========================================================
   ESTADO DE CARGA DE LA FOTOGRAFÍA
========================================================= */

const photoStatusElement =
  document.querySelector<HTMLElement>(
    "#photoStatus"
  );

const photoStatusTextElement =
  document.querySelector<HTMLElement>(
    "#photoStatusText"
  );

const photoErrorElement =
  document.querySelector<HTMLElement>(
    "#photoError"
  );

const photoUploadLabelElement =
  document.querySelector<HTMLElement>(
    "#photoUploadLabel"
  );

const photoUploadTextElement =
  document.querySelector<HTMLElement>(
    "#photoUploadText"
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
  !downloadButtonElement ||
  !showNameElement ||
  !nameControlsElement ||
  !photoNameTextElement ||
  !nameCounterElement
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

const showName =
  showNameElement;

const nameControls =
  nameControlsElement;

const photoNameText =
  photoNameTextElement;

const nameCounter =
  nameCounterElement;

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

let baseScale =
  1;

let zoom =
  1;

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


let currentPhotoArea:
  PhotoArea = {
    ...FULL_CANVAS_AREA,
  };


let currentFitArea:
  PhotoArea = {
    ...FULL_CANVAS_AREA,
  };


/* =========================================================
   ESTADO DE LA PLACA
========================================================= */

let showNamePlate =
  false;

let namePlateText =
  "";


/*
 * Imagen de la placa cargada en memoria.
 */
let namePlateImage:
  HTMLImageElement | null =
  null;


/*
 * Promesa compartida para evitar cargar
 * varias veces el mismo PNG.
 */
let namePlatePromise:
  Promise<HTMLImageElement> | null =
  null;


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

let dragStartX =
  0;

let dragStartY =
  0;

let centerStartX =
  0;

let centerStartY =
  0;


/* =========================================================
   ESTADOS DE INTERFAZ
========================================================= */

let isApplyingFrame =
  false;

let isDownloading =
  false;


let canvasHelpTimer:
  number | null =
  null;

let canvasHelpHideTimer:
  number | null =
  null;


let hasInteractedWithPhoto =
  false;


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


function wait(
  milliseconds: number
): Promise<void> {

  return new Promise(
    (resolve) => {

      window.setTimeout(
        resolve,
        milliseconds
      );

    }
  );
}


/* =========================================================
   NORMALIZAR ÁREA
========================================================= */

function normalizeArea(
  area: PhotoArea
): PhotoArea {

  const x =
    Number.isFinite(
      area.x
    )
      ? clamp(
          area.x,
          0,
          canvas.width - 1
        )
      : 0;


  const y =
    Number.isFinite(
      area.y
    )
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
    Number.isFinite(
      area.width
    )
      ? clamp(
          area.width,
          1,
          maxWidth
        )
      : maxWidth;


  const height =
    Number.isFinite(
      area.height
    )
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
   CONFIGURACIÓN DEL MARCO
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
        frame.id ===
        frameId
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
   ESTADO DE PROCESAMIENTO DE FOTOGRAFÍA
========================================================= */

function setPhotoProcessing(
  processing: boolean
): void {

  input.disabled =
    processing;


  if (photoUploadLabelElement) {

    photoUploadLabelElement.style.pointerEvents =
      processing
        ? "none"
        : "";

    photoUploadLabelElement.style.opacity =
      processing
        ? "0.65"
        : "";

  }


  if (photoStatusElement) {

    photoStatusElement.hidden =
      !processing;

  }


  if (
    processing &&
    photoStatusTextElement
  ) {

    photoStatusTextElement.textContent =
      "Procesando fotografía...";

  }


  if (photoUploadTextElement) {

    photoUploadTextElement.textContent =
      processing
        ? "Procesando..."
        : "Seleccionar fotografía";

  }
}


/* =========================================================
   ERROR DE FOTOGRAFÍA
========================================================= */

function clearPhotoError(): void {

  if (!photoErrorElement) {
    return;
  }


  photoErrorElement.hidden =
    true;

  photoErrorElement.textContent =
    "";
}


function showPhotoError(
  message: string
): void {

  if (!photoErrorElement) {
    return;
  }


  photoErrorElement.textContent =
    message;

  photoErrorElement.hidden =
    false;
}


/* =========================================================
   AYUDA SOBRE EL CANVAS
========================================================= */

function clearCanvasHelpTimers(): void {

  if (
    canvasHelpTimer !==
    null
  ) {

    window.clearTimeout(
      canvasHelpTimer
    );

    canvasHelpTimer =
      null;

  }


  if (
    canvasHelpHideTimer !==
    null
  ) {

    window.clearTimeout(
      canvasHelpHideTimer
    );

    canvasHelpHideTimer =
      null;

  }
}


function hideCanvasHelp(
  immediate = false
): void {

  if (!canvasHelpElement) {
    return;
  }


  clearCanvasHelpTimers();


  if (
    canvasHelpElement.hidden
  ) {
    return;
  }


  if (immediate) {

    canvasHelpElement.classList.remove(
      "is-hiding"
    );

    canvasHelpElement.hidden =
      true;

    canvasHelpElement.setAttribute(
      "aria-hidden",
      "true"
    );


    return;
  }


  canvasHelpElement.classList.add(
    "is-hiding"
  );


  canvasHelpHideTimer =
    window.setTimeout(
      () => {

        canvasHelpElement.hidden =
          true;

        canvasHelpElement.classList.remove(
          "is-hiding"
        );

        canvasHelpElement.setAttribute(
          "aria-hidden",
          "true"
        );

        canvasHelpHideTimer =
          null;

      },
      CANVAS_HELP_HIDE_DURATION
    );
}


function showCanvasHelp(): void {

  if (
    !canvasHelpElement ||
    hasInteractedWithPhoto
  ) {
    return;
  }


  clearCanvasHelpTimers();


  canvasHelpElement.classList.remove(
    "is-hiding"
  );

  canvasHelpElement.hidden =
    false;

  canvasHelpElement.setAttribute(
    "aria-hidden",
    "false"
  );


  canvasHelpTimer =
    window.setTimeout(
      () => {

        hideCanvasHelp();

      },
      CANVAS_HELP_DURATION
    );
}


/* =========================================================
   ESTADO CARGANDO MARCO
========================================================= */

function setFrameLoading(
  loading: boolean
): void {

  isApplyingFrame =
    loading;


  if (frameLoadingElement) {

    frameLoadingElement.hidden =
      !loading;

    frameLoadingElement.setAttribute(
      "aria-hidden",
      String(
        !loading
      )
    );

  }


  if (
    loading &&
    frameLoadingTextElement
  ) {

    frameLoadingTextElement.textContent =
      "Aplicando marco...";

  }


  for (
    const option
    of frameOptions
  ) {

    option.disabled =
      loading;

  }


  framesPrev.disabled =
    loading;

  framesNext.disabled =
    loading;

  resetButton.disabled =
    loading;

  zoomInput.disabled =
    loading;
}


/* =========================================================
   ESTADO DE DESCARGA
========================================================= */

function setDownloadLoading(
  loading: boolean
): void {

  isDownloading =
    loading;


  downloadButton.disabled =
    loading ||
    !currentImage;


  downloadButton.classList.toggle(
    "is-loading",
    loading
  );


  if (downloadSpinnerElement) {

    downloadSpinnerElement.hidden =
      !loading;

  }


  if (downloadTextElement) {

    downloadTextElement.textContent =
      loading
        ? "Preparando imagen..."
        : "Descargar imagen";

  }


  downloadButton.setAttribute(
    "aria-busy",
    String(
      loading
    )
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
   CARGAR PLACA
========================================================= */

function loadNamePlate():
  Promise<HTMLImageElement> {

  if (
    namePlateImage &&
    namePlateImage.complete &&
    namePlateImage.naturalWidth > 0
  ) {

    return Promise.resolve(
      namePlateImage
    );

  }


  if (namePlatePromise) {

    return namePlatePromise;

  }


  namePlatePromise =
    new Promise(
      (
        resolve,
        reject
      ) => {

        const image =
          new Image();


        image.onload =
          () => {

            if (
              image.naturalWidth <= 0 ||
              image.naturalHeight <= 0
            ) {

              namePlatePromise =
                null;


              reject(
                new Error(
                  "La imagen de la placa no es válida."
                )
              );


              return;
            }


            namePlateImage =
              image;


            resolve(
              image
            );
          };


        image.onerror =
          () => {

            namePlatePromise =
              null;


            reject(
              new Error(
                `No se pudo cargar la placa: ${NAMEPLATE_SRC}`
              )
            );
          };


        image.src =
          NAMEPLATE_SRC;
      }
    );


  return namePlatePromise;
}


/* =========================================================
   DIMENSIONES DE LA PLACA
========================================================= */

function getNamePlateDimensions(): {
  width: number;
  height: number;
} {

  if (
    !namePlateImage ||
    namePlateImage.naturalWidth <= 0 ||
    namePlateImage.naturalHeight <= 0
  ) {

    return {
      width: 0,
      height: 0,
    };

  }


  const width =
    Math.min(
      NAMEPLATE_MAX_WIDTH,
      canvas.width - 100
    );


  const aspectRatio =
    namePlateImage.naturalHeight /
    namePlateImage.naturalWidth;


  return {
    width,

    height:
      width *
      aspectRatio,
  };
}


/* =========================================================
   AJUSTAR TAMAÑO DEL NOMBRE
========================================================= */

function getNameFontSize(
  targetContext:
    CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): number {

  let fontSize =
    NAME_FONT_MAX_SIZE;


  while (
    fontSize >
    NAME_FONT_MIN_SIZE
  ) {

    targetContext.font =
      `700 ${fontSize}px Arial, Helvetica, sans-serif`;


    const width =
      targetContext.measureText(
        text
      ).width;


    if (
      width <=
      maxWidth
    ) {

      return fontSize;

    }


    fontSize -=
      2;
  }


  return NAME_FONT_MIN_SIZE;
}


/* =========================================================
   DIBUJAR PLACA Y NOMBRE
========================================================= */

function drawNamePlateToContext(
  targetContext:
    CanvasRenderingContext2D
): void {

  if (
    !showNamePlate ||
    !namePlateImage
  ) {
    return;
  }


  const {
    width,
    height,
  } =
    getNamePlateDimensions();


  if (
    width <= 0 ||
    height <= 0
  ) {
    return;
  }


  const x =
    NAMEPLATE_CENTER_X -
    width / 2;


  const y =
    NAMEPLATE_CENTER_Y -
    height / 2;


  targetContext.save();


  /*
   * Primero dibujamos la imagen PNG
   * transparente de la placa.
   */
  targetContext.drawImage(
    namePlateImage,
    x,
    y,
    width,
    height
  );


  const text =
    namePlateText.trim();


  /*
   * La placa puede mostrarse aunque el
   * usuario todavía no haya escrito nada.
   */
  if (
    text.length > 0
  ) {

    const textMaxWidth =
      width *
      NAME_TEXT_WIDTH_RATIO;


    const fontSize =
      getNameFontSize(
        targetContext,
        text,
        textMaxWidth
      );


    targetContext.font =
      `700 ${fontSize}px Arial, Helvetica, sans-serif`;


    targetContext.textAlign =
      "center";

    targetContext.textBaseline =
      "middle";


    /*
     * Sombra ligera para conservar la
     * legibilidad sobre la placa.
     */
    targetContext.shadowColor =
      "rgba(0, 0, 0, 0.45)";

    targetContext.shadowBlur =
      4;

    targetContext.shadowOffsetX =
      0;

    targetContext.shadowOffsetY =
      2;


    targetContext.fillStyle =
      "#ffffff";


    targetContext.fillText(
      text,
      NAMEPLATE_CENTER_X,
      NAMEPLATE_CENTER_Y,
      textMaxWidth
    );

  }


  targetContext.restore();
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


  /*
   * Orden de capas:
   *
   * 1. Fotografía
   * 2. Marco
   * 3. Placa
   * 4. Nombre
   */
  drawPhotoToContext(
    ctx
  );


  drawFrameToContext(
    ctx
  );


  drawNamePlateToContext(
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
   UI DEL ZOOM
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
   RESTABLECER ENCUADRE
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


  setPhotoProcessing(
    false
  );


  input.value =
    "";


  showPhotoError(
    message
  );


  if (!currentImage) {

    downloadButton.disabled =
      true;

  } else {

    downloadButton.disabled =
      false;

  }


  if (photoName) {

    photoName.textContent =
      currentImage
        ? "La fotografía anterior continúa activa."
        : "Ninguna fotografía seleccionada";

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


    clearPhotoError();


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


    setPhotoProcessing(
      true
    );


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


        setPhotoProcessing(
          false
        );


        setDownloadLoading(
          false
        );


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


        hasInteractedWithPhoto =
          false;


        showCanvasHelp();


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

    if (
      !currentImage ||
      isApplyingFrame
    ) {
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

    if (
      !currentImage ||
      isApplyingFrame ||
      isDownloading
    ) {
      return;
    }


    hasInteractedWithPhoto =
      true;


    hideCanvasHelp();


    isDragging =
      true;


    try {

      canvas.setPointerCapture(
        event.pointerId
      );

    } catch {

      /* El editor puede continuar. */

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
      !currentImage ||
      isApplyingFrame ||
      isDownloading
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

    /* El navegador pudo liberarlo antes. */

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

    if (
      isApplyingFrame ||
      isDownloading
    ) {
      return;
    }


    resetTransform();

  }
);


/* =========================================================
   CARGAR MARCO
========================================================= */

function loadFrame(
  src: string
): Promise<HTMLImageElement> {

  const allowedFrame =
    frames.some(
      (frame) =>
        frame.src ===
        src
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
   UI DE MARCOS
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


  updateScaleForCurrentArea(
    true
  );


  constrainPosition();
}


/* =========================================================
   SIN MARCO
========================================================= */

function applyNoFrame(): void {

  currentFrame =
    null;

  currentFrameId =
    "none";


  applyFrameAreas(
    "none"
  );


  draw();
}


/* =========================================================
   SELECCIONAR MARCO
========================================================= */

async function selectFrame(
  option:
    HTMLButtonElement
): Promise<void> {

  if (
    isApplyingFrame
  ) {
    return;
  }


  const frameId =
    option.dataset.frameId ??
    "none";


  const frameSrc =
    option.dataset.frame ??
    "";


  if (
    frameId ===
    currentFrameId
  ) {

    centerFrameOption(
      option
    );


    return;
  }


  const selectionToken =
    ++frameSelectionToken;


  updateFrameSelectionUI(
    option
  );


  centerFrameOption(
    option
  );


  if (
    frameId === "none" ||
    frameSrc === ""
  ) {

    applyNoFrame();


    return;
  }


  const frameConfiguration =
    frames.find(
      (frame) =>
        frame.id ===
          frameId &&
        frame.src ===
          frameSrc
    );


  if (!frameConfiguration) {

    console.error(
      "Configuración de marco inválida."
    );


    const noneOption =
      frameOptions.find(
        (item) =>
          item.dataset.frameId ===
          "none"
      );


    if (noneOption) {

      updateFrameSelectionUI(
        noneOption
      );

    }


    applyNoFrame();


    return;
  }


  const loadingStartedAt =
    performance.now();


  setFrameLoading(
    true
  );


  hideCanvasHelp(
    true
  );


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


    const elapsed =
      performance.now() -
      loadingStartedAt;


    const remaining =
      MIN_FRAME_LOADING_TIME -
      elapsed;


    if (
      remaining > 0
    ) {

      await wait(
        remaining
      );

    }


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


    const noneOption =
      frameOptions.find(
        (item) =>
          item.dataset.frameId ===
          "none"
      );


    if (noneOption) {

      updateFrameSelectionUI(
        noneOption
      );

    }


    applyNoFrame();

  } finally {

    if (
      selectionToken ===
      frameSelectionToken
    ) {

      setFrameLoading(
        false
      );

    }
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

    if (isApplyingFrame) {
      return;
    }


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

    if (isApplyingFrame) {
      return;
    }


    frameSelector.scrollBy({
      left:
        getCarouselScrollAmount(),

      behavior:
        "smooth",
    });

  }
);


/* =========================================================
   CONTADOR DEL NOMBRE
========================================================= */

function updateNameCounter(): void {

  const length =
    photoNameText.value.length;


  nameCounter.textContent =
    `${length} / ${NAME_MAX_LENGTH}`;


  nameCounter.classList.toggle(
    "is-limit",
    length >=
      NAME_MAX_LENGTH
  );
}


/* =========================================================
   ACTIVAR / DESACTIVAR NOMBRE
========================================================= */

showName.addEventListener(
  "change",
  async () => {

    showNamePlate =
      showName.checked;


    showName.setAttribute(
      "aria-expanded",
      String(
        showNamePlate
      )
    );


    nameControls.hidden =
      !showNamePlate;


    photoNameText.disabled =
      !showNamePlate;


    /*
     * Si se desactiva simplemente
     * retiramos la placa del canvas.
     *
     * Conservamos el texto escrito por si
     * el usuario vuelve a activarla.
     */
    if (!showNamePlate) {

      draw();

      return;
    }


    /*
     * Mostramos inmediatamente los
     * controles.
     */
    updateNameCounter();


    try {

      await loadNamePlate();


      /*
       * El usuario pudo apagar el switch
       * mientras cargaba el PNG.
       */
      if (!showName.checked) {
        return;
      }


      draw();


      /*
       * Llevamos el foco al campo para
       * continuar naturalmente el flujo.
       */
      photoNameText.focus();

    } catch (error) {

      console.error(
        "No se pudo cargar la placa del nombre:",
        error
      );


      /*
       * Si falla el asset restauramos
       * el switch para no dejar una
       * función aparentemente activa.
       */
      showNamePlate =
        false;

      showName.checked =
        false;

      showName.setAttribute(
        "aria-expanded",
        "false"
      );

      nameControls.hidden =
        true;

      photoNameText.disabled =
        true;
    }
  }
);


/* =========================================================
   ESCRIBIR NOMBRE
========================================================= */

photoNameText.addEventListener(
  "input",
  () => {

    /*
     * maxlength ya limita desde HTML,
     * pero volvemos a proteger el estado.
     */
    const value =
      photoNameText.value.slice(
        0,
        NAME_MAX_LENGTH
      );


    if (
      photoNameText.value !==
      value
    ) {

      photoNameText.value =
        value;

    }


    namePlateText =
      value;


    updateNameCounter();


    if (
      showNamePlate
    ) {

      draw();

    }
  }
);


/* =========================================================
   CANVAS DE EXPORTACIÓN
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
   * Mismo orden que la previsualización.
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


  drawNamePlateToContext(
    exportContext
  );


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
   DESCARGAR IMAGEN
========================================================= */

downloadButton.addEventListener(
  "click",
  async () => {

    if (
      !currentImage ||
      isDownloading ||
      isApplyingFrame
    ) {
      return;
    }


    setDownloadLoading(
      true
    );


    await new Promise<void>(
      (resolve) => {

        requestAnimationFrame(
          () => {

            requestAnimationFrame(
              () => {

                resolve();

              }
            );

          }
        );

      }
    );


    try {

      /*
       * Si el nombre está activo nos
       * aseguramos de que la placa esté
       * cargada antes de exportar.
       */
      if (
        showNamePlate &&
        !namePlateImage
      ) {

        await loadNamePlate();

      }


      const exportCanvas =
        createExportCanvas();


      if (!exportCanvas) {

        throw new Error(
          "No se pudo crear la imagen final."
        );

      }


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

      setDownloadLoading(
        false
      );

    }
  }
);


/* =========================================================
   INICIALIZACIÓN
========================================================= */

updateAreasForFrame(
  "none"
);


setFrameLoading(
  false
);


setDownloadLoading(
  false
);


setPhotoProcessing(
  false
);


hideCanvasHelp(
  true
);


clearPhotoError();


/*
 * Estado inicial del nombre.
 */
showName.checked =
  false;

showNamePlate =
  false;

nameControls.hidden =
  true;

photoNameText.disabled =
  true;

photoNameText.maxLength =
  NAME_MAX_LENGTH;

namePlateText =
  "";

updateNameCounter();


/*
 * Precargamos la placa en segundo plano.
 *
 * No bloquea el editor y hace que la
 * primera activación sea prácticamente
 * inmediata.
 */
void loadNamePlate().catch(
  (error) => {

    console.warn(
      "No se pudo precargar la placa:",
      error
    );

  }
);


drawPlaceholder();