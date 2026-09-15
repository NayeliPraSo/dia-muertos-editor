// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Por defecto usa la subcarpeta del servidor propio.
  // El workflow de GitHub Pages sobreescribe esto con
  // ASTRO_BASE="/dia-muertos-editor/" al hacer build.
  base: process.env.ASTRO_BASE ?? "/dia-muertos/",
});
