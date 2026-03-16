# Deush Poker Client 🃏

Un cliente de Poker moderno, rápido y visualmente atractivo construido con **Vue 3** y **Vite**. Diseñado para ofrecer una experiencia de juego fluida y responsiva en cualquier dispositivo.

## 🚀 Tecnologías Principales

- **Vue 3 (Composition API)**: Framework progresivo para interfaces de usuario.
- **Vite**: Herramienta de construcción de próxima generación para un desarrollo ultra rápido.
- **Pinia**: Gestión de estado centralizada y predecible.
- **Tailwind CSS**: Framework CSS para un diseño moderno y adaptable.
- **WebSockets (Native)**: Comunicación bidireccional en tiempo real con el servidor.
- **Vitest**: Suite de pruebas unitarias de alto rendimiento.

## ✨ Características Destacadas

- **HUD Inteligente**: La barra de acciones (`ActionBar.vue`) se adapta dinámicamente al tamaño de la pantalla, optimizando el espacio en móviles y aprovechando el ancho en escritorio.
- **Fichas Premium**: Componente de fichas (`Chip.vue`) con diseño skeuomórfico que incluye relieves 3D, sombras realistas y texturas de casino.
- **Sincronización Total**: Actualizaciones en tiempo real del pozo, cartas de la comunidad, turnos y logs del dealer.
- **Cálculo de Probabilidades**: Visualización dinámica de las probabilidades de ganar/empatar según la mano actual.
- **Sistema de Lobby**: Gestión de entrada de jugadores, códigos de juego y preparación para el inicio automático.

## 📁 Estructura del Proyecto

```text
src/
├── components/     # UI Components (ActionBar, Chip, Card, PokerTable, etc.)
├── store/          # Pinia Stores (pokerStore.js maneja toda la lógica del juego)
├── use/            # Composables (useSockets.js para la conexión WS)
├── pages/          # Vistas principales (Home, Game, Lobby)
└── router.js       # Configuración de rutas de navegación
```

## 🛠️ Instalación y Desarrollo

1.  **Instalar dependencias**:

    ```bash
    npm install
    ```

2.  **Iniciar entorno de desarrollo**:

    ```bash
    npm run dev
    ```

3.  **Construir para producción**:

    ```bash
    npm run build
    ```

4.  **Ejecutar pruebas**:
    ```bash
    npm test
    ```

## 🎨 Convenciones de Diseño

Este proyecto sigue estrictas reglas de nombrado de IDs para elementos de la interfaz:
`[nombre-descriptivo]-[TemplateSuffix]`
Ejemplo: `poker-table-viewport-TemplateLarge`

---

Desarrollado con ❤️ para amantes del Poker.
