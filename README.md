# 🏡 Simulador Hipotecario Analítico (Marzo 2026)

![Version](https://img.shields.io/badge/Versión-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/Estado-Producción-success.svg)
![JavaScript](https://img.shields.io/badge/JS-VanillaES6+-yellow.svg)
![HTML5](https://img.shields.io/badge/HTML-HTML5-orange.svg)
![CSS3](https://img.shields.io/badge/CSS-Responsive-blue.svg)

Un simulador y recomendador de hipotecas algorítmico de alto rendimiento, diseñado para cruzar normativas legales asimétricas, fiscalidad territorial española y variables socioeconómicas. El motor descarta entidades inviables y ordena las opciones bancarias más competitivas de España.

🔗 **[Demo en Vivo](https://NicoMM8.github.io/simulador-hipotecario/)**


1. **Algoritmo de Impuestos Asimétricos (ITP)**: Evalúa dinámicamente cruces de Comunidad Autónoma, Edad y tipo de Familia (monoparental, discapacidad) para calcular la partida de tributos reducidos frente a la norma general de Transmisiones Patrimoniales.
2. **Sistema Experto para Aval ICO (20% LTV extra)**: Implementación de la tabla de límites de validación de ingresos brutos (<37.800€, dependientes, edad, estado civil). Mapeo Booleano para inyectar hasta un 100% de Loan-to-Value si se cumplen las restrictivas condiciones legales.
3. **Persistencia y Caché de Perfiles (`localStorage`)**: Sistema reactivo al evento `input` para auto-salvado DOM y recuperación de perfiles generados sin necesidad de backend, garantizando anonimato de la simulación.
4. **Motor de Generación PDF (`html2pdf.js`)**: Modificación del layout bajo el capó para exportar infografías transaccionales imprimibles sin deformar las vistas *flex/grid*.
5. **Generador de Tablas de Amortización Francesa en *O(n)***: Re-renderizado DOM programático que construye paso a paso los flujos de capital, intereses y amortización mensual/anual.

## 🛠 Arquitectura Tecnológica

- **Core**: Vanilla JavaScript (ES6+), DOM Manipulation, Event Delegation.
- **Gráficos y Visualización**: `Chart.js` (Canvas Rendering) integrado con lógicas LTV y Gastos.
- **Estilos**: Vanilla CSS con variables nativas (`:root`), Flexbox, CSS Grid y *Responsive Design* adaptativo (`@media queries`).
- **Librerías externas**: Sistema de renderizado en cliente `html2pdf.js`.

## ⚙️ Características Clave Implementadas

*   **Motor de Búsqueda Parametrizada**: Ordenación multicriterio por `TAE` (Costo real del préstamo) y `TIN` (Cuota inicial ahogada), discriminando por Tipos Fijos, Variables o Mixtos.
*   **Base de Datos Dinámica 2026**: Object Array mapeando 23 Entidades Bancarias reales con diferenciales (*spreads*), Bonificaciones y Plazos Máximos paramétricos.
*   **Gestión de Excepciones Visuales**: El sistema escupe `Tags` de control visual cuando el usuario sobrepasa Límites LTV (Loan to value) o Ratio de Endeudamiento > 35%.

## 🚀 Instalación y Despliegue

```bash
# 1. Clona este repositorio
git clone https://github.com/NicoMM8/simulador-hipotecario.git

# 2. Navega al directorio
cd simulador-hipotecario

# 3. Lanza el servidor HTTP utilizando Python o Node (Evita CORS en importes tipo JSON/ES6 Module)
npx http-server -p 8080
# o
python -m http.server 8080
```

## 🗂 Estructura de Proyecto

```text
/
├── index.html       # Arquitectura UI Principal y Formulario
├── informe.html     # Reporte Macro-Económico de Marzo 2026
├── styles.css       # Sistema centralizado de estilos modulares (CSS Grid/Flex)
├── app.js           # DOM Hooks, Calculadoras PMT e ITP, y Gestión de Estado
├── offers.js        # Matriz de Objetos (Base de Datos Verificada de Bancos 2026)
└── README.md        # Documentación de Ingeniería
```

## 👨‍💻 Autor

Hipotecapp v1.0. Desarrollado como un caso analítico y algorítmico profundo sobre FinTech en España.

---
*Aviso legal: Simulador con propósitos educativos y de estudio de mercado algorítmico a base "Marzo 2026". Ninguno de los resultados es vinculante contractualmente.*
