
document.addEventListener('DOMContentLoaded', function () {
    initPerformanceCharts();
});

// 1. Capture "Now" once
const REFERENCE_NOW = new Date();
let currentRange = '15m';
let resizeTimeout;
const navigators = [];

class ChartNavigator {
    constructor(graphCard, index) {
        this.index = index;
        this.graphCard = graphCard;
        this.track = graphCard.querySelector('.navigator-track');
        this.windowEl = graphCard.querySelector('.navigator-window');
        this.handleLeft = graphCard.querySelector('.handle-left');
        this.handleRight = graphCard.querySelector('.handle-right');
        this.navWrapper = graphCard.querySelector('.navigator-canvas-wrapper');
        this.startLabel = graphCard.querySelector('.nav-start-label');
        this.endLabel = graphCard.querySelector('.nav-end-label');

        this.graphArea = graphCard.querySelector('.graph-area');
        this.xAxis = graphCard.querySelector('.graph-x-axis');

        // Configuration for the current range
        this.config = {
            totalMinutes: 120, // Default 15m range (2h total)
            labelStepMinutes: 15,
            windowDefaultPct: 12.5 // 15m is 12.5% of 120m
        };

        this.state = {
            isDragging: false,
            isResizingLeft: false,
            isResizingRight: false,
            startX: 0,
            startLeft: 0,
            startWidth: 0,
            trackWidth: 0,
            windowLeftPct: 100 - 12.5,
            windowWidthPct: 12.5,
            minWidthPct: 1,
            maxWidthPct: 100
        };

        this.initEvents();
        this.updateTrackWidth();
    }

    initEvents() {
        if (!this.track || !this.windowEl) return;

        this.startDrag = this.startDrag.bind(this);
        this.startResizeLeft = this.startResizeLeft.bind(this);
        this.startResizeRight = this.startResizeRight.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.stopInteraction = this.stopInteraction.bind(this);

        this.windowEl.addEventListener('mousedown', this.startDrag);
        this.handleLeft.addEventListener('mousedown', this.startResizeLeft);
        this.handleRight.addEventListener('mousedown', this.startResizeRight);

        this.windowEl.addEventListener('touchstart', this.startDrag);
        this.handleLeft.addEventListener('touchstart', this.startResizeLeft);
        this.handleRight.addEventListener('touchstart', this.startResizeRight);

        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.stopInteraction);
        document.addEventListener('touchmove', this.handleMouseMove);
        document.addEventListener('touchend', this.stopInteraction);

        const resizeObserver = new ResizeObserver(() => {
            this.updateTrackWidth();
            this.updateChart();
        });
        resizeObserver.observe(this.track);
    }

    updateTrackWidth() {
        if (this.track) this.state.trackWidth = this.track.offsetWidth;
    }

    getClientX(e) {
        return e.touches ? e.touches[0].clientX : e.clientX;
    }

    startDrag(e) {
        if (e.target.classList.contains('handle')) return;
        e.preventDefault();
        this.state.isDragging = true;
        this.state.startX = this.getClientX(e);
        this.state.startLeft = this.state.windowLeftPct;
    }

    startResizeLeft(e) {
        e.stopPropagation();
        e.preventDefault();
        this.state.isResizingLeft = true;
        this.state.startX = this.getClientX(e);
        this.state.startLeft = this.state.windowLeftPct;
        this.state.startWidth = this.state.windowWidthPct;
    }

    startResizeRight(e) {
        e.stopPropagation();
        e.preventDefault();
        this.state.isResizingRight = true;
        this.state.startX = this.getClientX(e);
        this.state.startWidth = this.state.windowWidthPct;
    }

    handleMouseMove(e) {
        if (!this.state.isDragging && !this.state.isResizingLeft && !this.state.isResizingRight) return;

        const currentX = this.getClientX(e);
        const deltaX = currentX - this.state.startX;
        const deltaPct = (deltaX / this.state.trackWidth) * 100;

        if (this.state.isDragging) {
            let newLeft = this.state.startLeft + deltaPct;
            if (newLeft < 0) newLeft = 0;
            if (newLeft + this.state.windowWidthPct > 100) newLeft = 100 - this.state.windowWidthPct;
            this.state.windowLeftPct = newLeft;
        } else if (this.state.isResizingLeft) {
            let newLeft = this.state.startLeft + deltaPct;
            let newWidth = this.state.startWidth - deltaPct;

            if (newLeft < 0) {
                newLeft = 0;
                newWidth = this.state.startWidth + this.state.startLeft;
            }
            if (newWidth < this.state.minWidthPct) {
                newWidth = this.state.minWidthPct;
                newLeft = this.state.startLeft + this.state.startWidth - this.state.minWidthPct;
            }
            this.state.windowLeftPct = newLeft;
            this.state.windowWidthPct = newWidth;
        } else if (this.state.isResizingRight) {
            let newWidth = this.state.startWidth + deltaPct;
            if (newWidth < this.state.minWidthPct) newWidth = this.state.minWidthPct;
            if (this.state.windowLeftPct + newWidth > 100) newWidth = 100 - this.state.windowLeftPct;
            this.state.windowWidthPct = newWidth;
        }

        this.updateUI();
        this.updateChart();
    }

    stopInteraction() {
        this.state.isDragging = false;
        this.state.isResizingLeft = false;
        this.state.isResizingRight = false;
    }

    updateUI() {
        if (this.windowEl) {
            this.windowEl.style.left = `${this.state.windowLeftPct}%`;
            this.windowEl.style.width = `${this.state.windowWidthPct}%`;
        }
    }

    setRange(range) {
        // Define Configuration based on Range
        // 15m: Total 2h (120m), Window 15m, Step 15m
        // 3h: Total 24h (1440m), Window 3h (180m), Step 3h (180m)
        // 1d: Total 7d (10080m), Window 1d (1440m), Step 1d (1440m)
        // 7d: Total 90d (129600m), Window 7d (10080m), Step 7d (10080m)
        // 30d: Total 180d (259200m), Window 30d (43200m), Step 30d (43200m)

        if (range === '15m') {
            this.config = { totalMinutes: 120, labelStepMinutes: 15, windowDefaultPct: (15 / 120) * 100 };
        } else if (range === '3h') {
            this.config = { totalMinutes: 1440, labelStepMinutes: 180, windowDefaultPct: (180 / 1440) * 100 };
        } else if (range === '1d') {
            this.config = { totalMinutes: 10080, labelStepMinutes: 1440, windowDefaultPct: (1440 / 10080) * 100 };
        } else if (range === '7d') {
            this.config = { totalMinutes: 129600, labelStepMinutes: 10080, windowDefaultPct: (10080 / 129600) * 100 };
        } else if (range === '30d') {
            this.config = { totalMinutes: 259200, labelStepMinutes: 43200, windowDefaultPct: (43200 / 259200) * 100 };
        }

        // Reset state
        this.state.windowWidthPct = this.config.windowDefaultPct;
        this.state.windowLeftPct = 100 - this.state.windowWidthPct; // Align to right (Now)

        // Generate Navigator Data (Full Range)
        // We generate points covering the totalMinutes ending at REFERENCE_NOW
        const navData = generateChartData(this.config.totalMinutes, 50); // 50 points for navigator shape

        // Render Navigator Chart
        if (this.navWrapper) {
            this.navWrapper.innerHTML = '';
            // Navigator doesn't need circles or specific label alignments, just the shape
            renderSvgChart(this.navWrapper, navData, this.index, true, []);
        }

        // Update Navigator Labels (Start and End of Total Range)
        if (this.startLabel && this.endLabel) {
            const startTime = new Date(REFERENCE_NOW.getTime() - this.config.totalMinutes * 60000);
            this.startLabel.innerHTML = formatSmartLabel(startTime, this.config.totalMinutes);
            this.endLabel.innerHTML = formatSmartLabel(REFERENCE_NOW, this.config.totalMinutes);
        }

        this.updateUI();
        this.updateChart();
    }

    updateChart() {
        // 1. Calculate Visible Time Range
        const visibleDurationMinutes = (this.state.windowWidthPct / 100) * this.config.totalMinutes;

        const trackStartTime = new Date(REFERENCE_NOW.getTime() - this.config.totalMinutes * 60000);
        const visibleStartTime = new Date(trackStartTime.getTime() + (this.state.windowLeftPct / 100) * this.config.totalMinutes * 60000);
        const visibleEndTime = new Date(visibleStartTime.getTime() + visibleDurationMinutes * 60000);

        // 2. Generate Labels
        // Labels must be generated based on the Total Range grid (REFERENCE_NOW backwards by labelStepMinutes)
        // We filter only those that fall within visibleStartTime and visibleEndTime

        const labels = [];
        const labelTimestamps = []; // Store timestamps to sync with circles

        const stepMs = this.config.labelStepMinutes * 60000;

        // We iterate backwards from Now
        let currentTime = REFERENCE_NOW.getTime();
        const minVisible = visibleStartTime.getTime();
        const maxVisible = visibleEndTime.getTime();

        // Safety break
        let iterations = 0;
        while (currentTime >= trackStartTime.getTime() && iterations < 1000) {
            if (currentTime >= minVisible && currentTime <= maxVisible) {
                labels.push({
                    time: new Date(currentTime),
                    text: formatSmartLabel(new Date(currentTime), this.config.totalMinutes)
                });
                labelTimestamps.push(currentTime);
            }
            currentTime -= stepMs;
            iterations++;
        }

        // Sort labels by time ascending (left to right)
        labels.sort((a, b) => a.time - b.time);
        labelTimestamps.sort((a, b) => a - b);

        // 3. Update X-Axis
        if (this.xAxis && this.graphArea) {
            this.xAxis.innerHTML = labels.map(l => {
                // Calculate position percentage relative to Visible Window
                const timeInWindow = l.time.getTime() - minVisible;
                const windowDurationMs = maxVisible - minVisible;
                const pct = (timeInWindow / windowDurationMs) * 100;

                let style = `left: ${pct}%;`;
                // Adjust transform to center, but keep edges inside
                if (pct < 5) style += ` transform: translateX(0%);`;
                else if (pct > 95) style += ` transform: translateX(-100%);`;
                else style += ` transform: translateX(-50%);`;

                return `<span class="x-label" style="${style}">${l.text}</span>`;
            }).join('');

            // 4. Update Chart Visual
            const existingWrapper = this.graphArea.querySelector('.chart-visual-wrapper');
            if (existingWrapper) existingWrapper.remove();

            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'chart-visual-wrapper';
            chartWrapper.style.position = 'relative';
            chartWrapper.style.flex = '1';
            chartWrapper.style.width = '100%';
            chartWrapper.style.minHeight = '100px';

            const baseline = this.graphArea.querySelector('.graph-baseline');
            if (baseline) {
                this.graphArea.insertBefore(chartWrapper, baseline);
            } else {
                this.graphArea.insertBefore(chartWrapper, this.xAxis);
            }

            // Generate Data Points for the Visible Window
            // We need a high resolution line, but we MUST have points at 'labelTimestamps'
            // Let's generate points every (visibleDuration / 50) roughly, but snap to labelTimestamps

            const chartData = [];
            // Add label points first
            labelTimestamps.forEach(ts => {
                chartData.push({ time: ts, value: Math.floor(Math.random() * 60) + 20, isLabel: true });
            });

            // Fill gaps with random points for smooth line
            const numFillPoints = 30;
            const fillStep = (maxVisible - minVisible) / numFillPoints;
            for (let i = 0; i <= numFillPoints; i++) {
                const ts = minVisible + i * fillStep;
                // Don't add if too close to a label point
                if (!labelTimestamps.some(lts => Math.abs(lts - ts) < fillStep / 2)) {
                    chartData.push({ time: ts, value: Math.floor(Math.random() * 60) + 20, isLabel: false });
                }
            }

            // Sort by time
            chartData.sort((a, b) => a.time - b.time);

            renderSvgChart(chartWrapper, chartData, this.index, false, labelTimestamps);
        }
    }
}

function initPerformanceCharts() {
    const timeButtons = document.querySelectorAll('.time-btn');
    const graphCards = document.querySelectorAll('.graph-card');

    graphCards.forEach((card, index) => {
        const nav = new ChartNavigator(card, index);
        navigators.push(nav);
    });

    navigators.forEach(nav => nav.setRange(currentRange));

    timeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            timeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const text = this.textContent.trim().toLowerCase();
            if (text.includes('3 horas')) currentRange = '3h';
            else if (text.includes('1 día')) currentRange = '1d';
            else if (text.includes('7 días')) currentRange = '7d';
            else if (text.includes('30 días')) currentRange = '30d';
            else currentRange = '15m';

            navigators.forEach(nav => nav.setRange(currentRange));
        });
    });
}

// --- Helper Functions ---

function formatSmartLabel(date, totalMinutes) {
    const formatTime = (d) => {
        let hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${strMinutes} ${ampm}`;
    };

    const formatDate = (d) => {
        const day = d.getDate();
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const month = months[d.getMonth()];
        // Font size difference for month
        return `${day} <span style="font-size: 0.85em;">${month}</span>`;
    };

    // If total range is > 24h (1440m), show Date. Else show Time.
    // 15m (120) -> Time
    // 3h (1440) -> Time (User said "24 Hrs antes", usually implies time, but maybe date if crossing midnight? Let's stick to Time for < 1d)
    // 1d (10080) -> Date
    if (totalMinutes <= 1440) {
        return formatTime(date);
    } else {
        return formatDate(date);
    }
}

function generateChartData(totalMinutes, pointCount) {
    // Generate simple array of values for Navigator
    const values = [];
    for (let i = 0; i < pointCount; i++) {
        values.push(Math.floor(Math.random() * 60) + 20);
    }
    return values;
}

function renderSvgChart(container, data, chartIndex, isMini = false, labelTimestamps = []) {
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const gradientId = `chartGradient-${chartIndex}-${isMini ? 'mini' : 'main'}-${Math.random().toString(36).substr(2, 9)}`;

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

    // Gradient
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
    stop1.setAttribute("stop-opacity", isMini ? "0.4" : "0.6");

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#00d2ff");
    stop2.setAttribute("stop-opacity", "0");

    linearGradient.appendChild(stop1);
    linearGradient.appendChild(stop2);
    defs.appendChild(linearGradient);
    svg.appendChild(defs);

    // Prepare Points
    let points = [];
    if (isMini) {
        // Data is just array of numbers
        const stepX = width / (data.length - 1);
        points = data.map((val, i) => ({ x: i * stepX, y: height - (val / 100) * height }));
    } else {
        // Data is array of { time, value, isLabel }
        // We need to map time to X
        if (data.length < 2) return;
        const minTime = data[0].time;
        const maxTime = data[data.length - 1].time;
        const timeRange = maxTime - minTime;

        points = data.map(d => ({
            x: ((d.time - minTime) / timeRange) * width,
            y: height - (d.value / 100) * (height * 0.8),
            isLabel: d.isLabel
        }));
    }

    if (points.length < 2) return;

    // Path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;
        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    // Area
    const areaPathData = `${pathD} L ${width} ${height} L 0 ${height} Z`;
    const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    areaPath.setAttribute("d", areaPathData);
    areaPath.setAttribute("fill", `url(#${gradientId})`);
    areaPath.setAttribute("stroke", "none");
    svg.appendChild(areaPath);

    if (!isMini) {
        const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        linePath.setAttribute("d", pathD);
        linePath.setAttribute("fill", "none");
        linePath.setAttribute("stroke", "#00d2ff");
        linePath.setAttribute("stroke-width", "2");
        linePath.setAttribute("stroke-linecap", "round");
        linePath.setAttribute("stroke-linejoin", "round");
        svg.appendChild(linePath);

        // Circles - Only where isLabel is true
        points.forEach(p => {
            if (p.isLabel) {
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", p.x);
                circle.setAttribute("cy", p.y);
                circle.setAttribute("r", "3");
                circle.setAttribute("fill", "white");
                circle.style.cursor = "pointer";
                circle.style.transition = "r 0.3s ease";
                circle.addEventListener('mouseenter', () => circle.setAttribute("r", "6"));
                circle.addEventListener('mouseleave', () => circle.setAttribute("r", "3"));
                svg.appendChild(circle);
            }
        });
    }

    container.appendChild(svg);
}
