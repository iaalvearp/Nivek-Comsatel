
document.addEventListener('DOMContentLoaded', function () {
    initPerformanceCharts();
});

let currentRange = '15m';
let resizeTimeout;

function initPerformanceCharts() {
    const timeButtons = document.querySelectorAll('.time-btn');

    // Initial render
    handleTimeSelection(currentRange);

    timeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all
            timeButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            this.classList.add('active');

            // Determine time range based on button text
            const text = this.textContent.trim().toLowerCase();
            if (text.includes('3 horas')) currentRange = '3h';
            else if (text.includes('1 día')) currentRange = '1d';
            else if (text.includes('7 días')) currentRange = '7d';
            else if (text.includes('30 días')) currentRange = '30d';
            else currentRange = '15m';

            handleTimeSelection(currentRange);
        });
    });

    // ResizeObserver to handle accordion opening and window resizing
    const resizeObserver = new ResizeObserver(entries => {
        let shouldUpdate = false;
        for (const entry of entries) {
            // Only trigger if element has size (is visible)
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                shouldUpdate = true;
                break;
            }
        }

        if (shouldUpdate) {
            // Debounce to prevent multiple calls
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                handleTimeSelection(currentRange);
            }, 100);
        }
    });

    document.querySelectorAll('.graph-area').forEach(area => {
        resizeObserver.observe(area);
    });
}


function handleTimeSelection(range) {
    // Update all charts with the new X-axis labels and points
    const chartContainers = document.querySelectorAll('.graph-container');

    chartContainers.forEach((container, index) => {
        const xAxis = container.querySelector('.graph-x-axis');
        const graphArea = container.querySelector('.graph-area');

        if (xAxis && graphArea) {
            const data = generateChartData(range);

            // Update Labels with absolute positioning for perfect alignment
            xAxis.innerHTML = data.labels.map((label, i) => {
                const pct = (i / (data.labels.length - 1)) * 100;
                let style = `left: ${pct}%;`;

                // Align first and last labels to stay within bounds
                if (i === 0) style += ` transform: translateX(0%);`;
                else if (i === data.labels.length - 1) style += ` transform: translateX(-100%);`;
                else style += ` transform: translateX(-50%);`;

                return `<span class="x-label" style="${style}">${label}</span>`;
            }).join('');

            // Remove existing SVG or points if any
            // We also need to handle the wrapper if we created one previously
            const existingWrapper = graphArea.querySelector('.chart-visual-wrapper');
            if (existingWrapper) existingWrapper.remove();

            const existingVisual = graphArea.querySelector('.graph-visual');
            if (existingVisual) existingVisual.remove();
            const existingBaseline = graphArea.querySelector('.graph-baseline');
            if (existingBaseline) existingBaseline.remove();
            const existingPoints = graphArea.querySelector('.graph-points');
            if (existingPoints) existingPoints.remove();

            // Create a wrapper for the SVG to ensure it sits ABOVE the x-axis in flow
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'chart-visual-wrapper';
            chartWrapper.style.position = 'relative';
            chartWrapper.style.flex = '1'; // Take remaining space
            chartWrapper.style.width = '100%';
            chartWrapper.style.minHeight = '100px'; // Ensure some height

            // Insert wrapper BEFORE the x-axis
            graphArea.insertBefore(chartWrapper, xAxis);

            // Render SVG Chart into the wrapper
            renderSvgChart(chartWrapper, data.values, index);
        }
    });
}

function renderSvgChart(container, dataPoints, chartIndex) {
    // Container dimensions
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    // We need a unique ID for the gradient
    const gradientId = `chartGradient-${chartIndex}`;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.zIndex = "1";
    svg.style.overflow = "visible";

    // Define Gradient
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const linearGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    linearGradient.setAttribute("id", gradientId);
    linearGradient.setAttribute("x1", "0%");
    linearGradient.setAttribute("y1", "0%");
    linearGradient.setAttribute("x2", "0%");
    linearGradient.setAttribute("y2", "100%");

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#00d2ff");
    stop1.setAttribute("stop-opacity", "0.6");

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "50%");
    stop2.setAttribute("stop-color", "#00d2ff");
    stop2.setAttribute("stop-opacity", "0.2");

    const stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", "#00d2ff");
    stop3.setAttribute("stop-opacity", "0");

    linearGradient.appendChild(stop1);
    linearGradient.appendChild(stop2);
    linearGradient.appendChild(stop3);
    defs.appendChild(linearGradient);
    svg.appendChild(defs);

    // Calculate points coordinates
    // X distributed evenly
    // We need to match the labels count.
    // If we have N labels, we should have N points.
    const stepX = width / (dataPoints.length - 1);
    const points = dataPoints.map((val, i) => {
        const x = i * stepX;
        // Invert Y because SVG 0 is top. 
        // val is 0-100. height is available height.
        // Leave some padding at top (20%) so it doesn't hit the ceiling hard
        const y = height - (val / 100) * (height * 0.8);
        return { x, y };
    });

    // Generate Path Data (User's Bezier Logic)
    let pathD = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];

        // Midpoint approach
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;

        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    // Area Path (closed at bottom)
    const areaPathData = `${pathD} L ${width} ${height} L 0 ${height} Z`;

    // Create Area Path Element
    const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    areaPath.setAttribute("d", areaPathData);
    areaPath.setAttribute("fill", `url(#${gradientId})`);
    areaPath.setAttribute("stroke", "none");
    areaPath.style.opacity = "0.8";
    svg.appendChild(areaPath);

    // Create Line Path Element
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePath.setAttribute("d", pathD);
    linePath.setAttribute("fill", "none");
    linePath.setAttribute("stroke", "#00d2ff");
    linePath.setAttribute("stroke-width", "2");
    linePath.setAttribute("stroke-linecap", "round");
    linePath.setAttribute("stroke-linejoin", "round");
    svg.appendChild(linePath);

    // Add dots
    points.forEach(p => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", "3");
        circle.setAttribute("fill", "white");
        circle.style.cursor = "pointer";
        circle.style.transition = "r 0.3s ease";

        // Hover effect (simple inline)
        circle.addEventListener('mouseenter', () => circle.setAttribute("r", "6"));
        circle.addEventListener('mouseleave', () => circle.setAttribute("r", "3"));

        svg.appendChild(circle);
    });

    container.appendChild(svg);
}

function generateChartData(range) {
    let labels = [];
    let values = []; // 0-100
    const now = new Date();

    // Helper to format time
    const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${strMinutes} ${ampm}`;
    };

    // Helper to format hour only
    const formatHour = (date) => {
        let hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours} ${ampm}`;
    };

    // Helper to format date (e.g., 26 NOV)
    const formatDate = (date) => {
        const day = date.getDate();
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const month = months[date.getMonth()];
        return `${day} ${month}`;
    };

    // Helper to format month year (e.g., DIC 2024)
    const formatMonthYear = (date) => {
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${month} ${year}`;
    };

    if (range === '15m') {
        let current = new Date(now);
        const remainder = current.getMinutes() % 15;
        current.setMinutes(current.getMinutes() - remainder);
        for (let i = 8; i >= 0; i--) { // Increased points for smoother curve
            const d = new Date(current);
            d.setMinutes(current.getMinutes() - (i * 15));
            if (d.getMinutes() === 0) labels.push(formatHour(d));
            else labels.push(formatTime(d));
            values.push(Math.floor(Math.random() * 60) + 20);
        }
    } else if (range === '3h') {
        let current = new Date(now);
        const remainder = current.getHours() % 3;
        current.setHours(current.getHours() - remainder, 0, 0, 0);
        for (let i = 8; i >= 0; i--) {
            const d = new Date(current);
            d.setHours(current.getHours() - (i * 3));
            labels.push(formatHour(d));
            values.push(Math.floor(Math.random() * 60) + 20);
        }
    } else if (range === '1d') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            labels.push(formatDate(d));
            values.push(Math.floor(Math.random() * 60) + 20);
        }
    } else if (range === '7d') {
        for (let i = 6; i >= 0; i--) { // More points for 7d to look nice
            const d = new Date(now);
            d.setDate(now.getDate() - (i * 7));
            labels.push(formatDate(d));
            values.push(Math.floor(Math.random() * 60) + 20);
        }
    } else if (range === '30d') {
        for (let i = 11; i >= 0; i--) { // Show 12 months
            const d = new Date(now);
            d.setMonth(now.getMonth() - i);
            labels.push(formatMonthYear(d));
            values.push(Math.floor(Math.random() * 60) + 20);
        }
    }

    return { labels, values };
}
