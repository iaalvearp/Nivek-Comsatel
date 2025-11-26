// Controlador del gráfico de consumo de datos
// IDs en español para fácil integración con API

// Estructura de datos de meses con días correctos
const MESES_DATA = {
    'abr': { nombre: 'ABR', dias: 30, etiqueta: 'Abril' },
    'may': { nombre: 'MAY', dias: 31, etiqueta: 'Mayo' },
    'jun': { nombre: 'JUN', dias: 30, etiqueta: 'Junio' },
    'jul': { nombre: 'JUL', dias: 31, etiqueta: 'Julio' },
    'ago': { nombre: 'AGO', dias: 31, etiqueta: 'Agosto' },
    'sep': { nombre: 'SEP', dias: 30, etiqueta: 'Septiembre' },
    'oct-nov': { nombre: 'OCT', dias: 31, etiqueta: 'Octubre' }
};

// Datos de ejemplo de consumo (GB)
// En producción, estos datos vendrán de la API
const CONSUMO_EJEMPLO = {
    'oct-nov': [
        0.1, 0.2, 0.4, 0.3, 0.5, 0.2, 0.1, 0.3, 0.4, 0.6,
        0.2, 0.3, 0.5, 0.4, 0.3, 0.2, 0.4, 0.5, 0.3, 0.2,
        0.1, 0.3, 0.4, 0.2, 0.5, 0.3, 0.2, 0.4, 0.3, 0.2, 0.1
    ],
    'abr': Array(30).fill(0).map(() => Math.random() * 0.5),
    'may': Array(31).fill(0).map(() => Math.random() * 0.5),
    'jun': Array(30).fill(0).map(() => Math.random() * 0.5),
    'jul': Array(31).fill(0).map(() => Math.random() * 0.5),
    'ago': Array(31).fill(0).map(() => Math.random() * 0.5),
    'sep': Array(30).fill(0).map(() => Math.random() * 0.5)
};

let mesActual = 'oct-nov';

// Inicializar el gráfico cuando la página cargue
document.addEventListener('DOMContentLoaded', function () {
    inicializarGrafico();
});

function inicializarGrafico() {
    // Configurar event listeners para los botones de meses
    document.querySelectorAll('.btn-mes').forEach(btn => {
        btn.addEventListener('click', function () {
            const mes = this.getAttribute('data-mes');
            seleccionarMes(mes);
        });
    });

    // Generar el gráfico inicial (OCT-NOV)
    generarBarras(mesActual);
}

function seleccionarMes(mes) {
    // Actualizar estado visual de botones
    document.querySelectorAll('.btn-mes').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-mes-${mes}`).classList.add('active');

    // Actualizar mes actual
    mesActual = mes;

    // Regenerar barras
    generarBarras(mes);
}

function generarBarras(mes) {
    const mesInfo = MESES_DATA[mes];
    const dias = mesInfo.dias;
    const consumoDatos = CONSUMO_EJEMPLO[mes] || [];
    const maxConsumo = 10; // 10 GB es el máximo en la escala

    const contenedorBarras = document.getElementById('barras-consumo');
    const contenedorEtiquetas = document.getElementById('etiquetas-dias');

    // Limpiar contenido anterior
    contenedorBarras.innerHTML = '';
    contenedorEtiquetas.innerHTML = '';

    // Generar barras para cada día
    for (let dia = 1; dia <= dias; dia++) {
        const barra = document.createElement('div');
        const consumo = consumoDatos[dia - 1] || 0;

        if (consumo > 0) {
            // Barra con consumo
            barra.className = 'barra-dia consumo';
            const altura = (consumo / maxConsumo) * 100;
            barra.style.height = `${Math.max(altura, 2)}%`; // Mínimo 2% para visibilidad

            // Atributos de datos para el tooltip
            barra.setAttribute('data-dia', dia);
            barra.setAttribute('data-consumo', consumo.toFixed(1));
            barra.setAttribute('data-mes', mesInfo.nombre);

            // Event listeners para el tooltip
            barra.addEventListener('mouseenter', function () {
                mostrarTooltip(this);
            });
            barra.addEventListener('mouseleave', ocultarTooltip);
        } else {
            // Barra tick (día sin consumo)
            barra.className = 'barra-dia tick';
        }

        contenedorBarras.appendChild(barra);
    }

    // Generar etiquetas de días (primer y último día)
    const etiquetaPrimera = document.createElement('span');
    etiquetaPrimera.className = 'etiqueta-dia';
    etiquetaPrimera.textContent = `${mesInfo.nombre} 1`;

    const etiquetaUltima = document.createElement('span');
    etiquetaUltima.className = 'etiqueta-dia';
    etiquetaUltima.textContent = `${mesInfo.nombre} ${dias}`;

    contenedorEtiquetas.appendChild(etiquetaPrimera);
    contenedorEtiquetas.appendChild(etiquetaUltima);
}

function mostrarTooltip(barraElement) {
    const tooltip = document.getElementById('tooltip-consumo');
    const dia = barraElement.getAttribute('data-dia');
    const consumo = barraElement.getAttribute('data-consumo');
    const mes = barraElement.getAttribute('data-mes');

    // Actualizar contenido del tooltip
    document.getElementById('tooltip-fecha').textContent = `${mes} ${dia}`;
    document.getElementById('tooltip-valor').textContent = `${consumo} GB`;

    // Posicionar tooltip cerca de la barra
    const barraRect = barraElement.getBoundingClientRect();
    const contenedorRect = barraElement.parentElement.getBoundingClientRect();

    const posicionRelativa = barraRect.left - contenedorRect.left;
    const anchoContenedor = contenedorRect.width;

    // Calcular posición (mantener dentro del contenedor)
    let leftPercent = (posicionRelativa / anchoContenedor) * 100;
    leftPercent = Math.max(15, Math.min(85, leftPercent)); // Limitar entre 15% y 85%

    tooltip.style.left = `${leftPercent}%`;

    // Mostrar tooltip
    tooltip.classList.add('visible');
}

function ocultarTooltip() {
    const tooltip = document.getElementById('tooltip-consumo');
    tooltip.classList.remove('visible');
}

// Exponer funciones para uso externo (API)
window.graficoConsumo = {
    seleccionarMes,
    actualizarDatos: function (mes, datos) {
        CONSUMO_EJEMPLO[mes] = datos;
        if (mes === mesActual) {
            generarBarras(mes);
        }
    },
    obtenerMesActual: function () {
        return mesActual;
    }
};
