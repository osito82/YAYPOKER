# 🤖 Poker AI Bot (Multi-LLM Edition)

Este es un cliente independiente para el servidor de Poker que puede utilizar tanto **Google Gemini** como modelos locales mediante **Ollama** (como OpenLLama).

## 🚀 Instalación

1. Asegúrate de tener Node.js instalado.
2. Ve a la carpeta del bot:
   ```bash
   cd bot
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```

## 🧠 Proveedores de IA

El bot soporta dos proveedores:

### 1. Google Gemini (Nube)
Necesitas una API Key de [Google AI Studio](https://aistudio.google.com/).
- **Uso**: `node bot.js --provider=gemini --key=TU_API_KEY`

### 2. OpenLLama / Ollama (Local)
Para usar modelos locales, debes tener instalado [Ollama](https://ollama.com/).
1. Descarga el modelo: `ollama run openllama` (o `llama3`, `mistral`, etc.)
2. Asegúrate de que Ollama esté corriendo.
- **Uso**: `node bot.js --provider=openllama --model=openllama`

## 🎮 Comandos de ejemplo

### Jugar con Gemini
```bash
node bot.js --gameCode=TU_CODIGO --name=Gemini_Bot --provider=gemini --key=TU_API_KEY
```

### Jugar con OpenLLama (Local)
```bash
node bot.js --name=Llama_Bot --provider=openllama --model=openllama --gameCode=TU_CODIGO
node bot.js --name=Llama_Bot --provider=openllama --model=openllama --gameCode=NK2DF-CG0DL
```

## 🛠️ Argumentos
- `--provider`: `gemini` (default) o `openllama`.
- `--model`: Nombre del modelo (default: `gemini-1.5-flash` o `openllama`).
- `--gameCode`: Código de la mesa.
- `--name`: Nombre del bot.
- `--key`: API Key (solo para Gemini).

---
&copy; 2026 YayPoker Engineering



curl http://127.0.0.1:11434/v1/models