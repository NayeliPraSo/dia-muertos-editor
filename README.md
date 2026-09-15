# 🎨 Editor de Fotos Día de Muertos

Crea tu retrato personalizado de Día de Muertos directamente desde el navegador. Sube una fotografía, ajusta el encuadre, elige un marco temático y añade tu nombre en una placa — todo sin subir tu imagen a ningún servidor.

**[Ver demo en vivo →](https://nayelipraso.github.io/dia-muertos-editor/)**

## ✨ Características

- **100% en el cliente**: la fotografía se procesa con `<canvas>` en el propio navegador; nunca se envía ni almacena en un servidor.
- **Encuadre interactivo**: arrastra y haz zoom sobre tu fotografía para ajustarla dentro del marco.
- **6 marcos temáticos** de Día de Muertos, seleccionables desde un carrusel.
- **Placa de nombre opcional**: agrega tu nombre y se ajusta automáticamente al ancho disponible.
- **Exportación a PNG** en alta resolución (1080 × 1350 px), lista para redes sociales.
- **Accesible**: navegación por teclado, estados `aria-live` para carga y errores, foco visible.

## 🛠️ Stack técnico

- [Astro](https://astro.build) 7
- TypeScript
- Canvas API (sin librerías externas para el procesamiento de imagen)
- pnpm como gestor de paquetes

## 🚀 Empezando

### Requisitos

- Node.js `>=22.12.0`
- pnpm `>=7.1.0`

### Instalación

```sh
pnpm install
```

### Desarrollo

```sh
pnpm dev
```

Abre [http://localhost:4321](http://localhost:4321) para ver el proyecto.

### Build de producción

```sh
pnpm build
pnpm preview
```

## 📁 Estructura del proyecto

```text
/
├── public/
│   ├── frames/          # Marcos PNG (transparentes) usados en el editor
│   └── nameplates/       # Placa PNG para el nombre
├── src/
│   ├── components/
│   │   └── PhotoEditor/
│   │       ├── PhotoEditor.astro   # Markup y controles del editor
│   │       ├── photo-editor.ts     # Lógica de canvas, drag, zoom, export
│   │       ├── photo-editor.css    # Estilos del editor
│   │       └── frames.data.ts      # Configuración de cada marco (áreas de encuadre)
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── astro.config.mjs
```

### Cómo agregar un nuevo marco

1. Coloca el PNG (transparente, 1080 × 1350 px) en `public/frames/`.
2. Agrega una entrada en `src/components/PhotoEditor/frames.data.ts` con:
   - `photoArea`: la zona donde la fotografía puede dibujarse (máscara estricta).
   - `fitArea`: la zona usada para calcular el encuadre mínimo al 100 % (normalmente más pequeña que `photoArea`, para un encuadre más abierto).
3. El nuevo marco aparecerá automáticamente en el carrusel de selección.

## 🔒 Privacidad

Ninguna fotografía sale del dispositivo del usuario. Todo el procesamiento —encuadre, marco y exportación— ocurre en el navegador mediante la Canvas API.

## 📄 Licencia

_Pendiente de definir._

## 🙏 Créditos

Diseño de marcos y placa:
