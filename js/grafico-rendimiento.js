
document.addEventListener('DOMContentLoaded', function () {
    initPerformanceCharts();
});

function initPerformanceCharts() {
    const timeButtons = document.querySelectorAll('.time-btn');

    // Set initial active state (15 minutos)
    handleTimeSelection('15m');

    timeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all
            timeButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            this.classList.add('active');

            // Determine time range based on button text
            const text = this.textContent.trim().toLowerCase();
            let range = '15m';
            if (text.includes('3 horas')) range = '3h';
            else if (text.includes('1 día')) range = '1d';
            else if (text.includes('7 días')) range = '7d';
            else if (text.includes('30 días')) range = '30d';

            handleTimeSelection(range);
        });
    });
}


function handleTimeSelection(range) {
    // Update all charts with the new X-axis labels and points
    const chartContainers = document.querySelectorAll('.graph-container');

    chartContainers.forEach(container => {
        const xAxis = container.querySelector('.graph-x-axis');
        const graphArea = container.querySelector('.graph-area');

        if (xAxis && graphArea) {
            const data = generateChartData(range);

            // Update Labels
            xAxis.innerHTML = data.labels.map(label => `<span class="x-label">${label}</span>`).join('');

            // Update Points
            // Check if points container exists, if not create it
            let pointsContainer = graphArea.querySelector('.graph-points');
            if (!pointsContainer) {
                pointsContainer = document.createElement('div');
                pointsContainer.className = 'graph-points';
                graphArea.appendChild(pointsContainer);
            }

            // Generate points HTML
            // We use random heights for demo purposes since we don't have real data per chart yet
            // In a real app, 'data' would include values.
            pointsContainer.innerHTML = data.labels.map(() => {
                const randomHeight = Math.floor(Math.random() * 60) + 20; // 20% to 80%
                return `
                    <div class="point-wrapper" style="height: ${randomHeight}%">
                        <div class="graph-point"></div>
                    </div>
                `;
            }).join('');
        }

        // Optional: Animate graph visual change (mock)
        const visual = container.querySelector('.graph-visual');
        if (visual) {
            visual.style.opacity = '0.5';
            setTimeout(() => visual.style.opacity = '1', 200);
        }
    });
}

function generateChartData(range) {
    let labels = [];
    const now = new Date(); // Use current time as reference

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
        for (let i = 4; i >= 0; i--) {
            const d = new Date(current);
            d.setMinutes(current.getMinutes() - (i * 15));
            if (d.getMinutes() === 0) labels.push(formatHour(d));
            else labels.push(formatTime(d));
        }
    } else if (range === '3h') {
        let current = new Date(now);
        const remainder = current.getHours() % 3;
        current.setHours(current.getHours() - remainder, 0, 0, 0);
        for (let i = 4; i >= 0; i--) {
            const d = new Date(current);
            d.setHours(current.getHours() - (i * 3));
            labels.push(formatHour(d));
        }
    } else if (range === '1d') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            labels.push(formatDate(d));
        }
    } else if (range === '7d') {
        for (let i = 4; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - (i * 7));
            labels.push(formatDate(d));
        }
    } else if (range === '30d') {
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(now.getMonth() - i);
            labels.push(formatMonthYear(d));
        }
    }

    return { labels };
}
