const MAX_OLD_LOG = 1000; // old logs will be pruned if exceeded
const MAX_CHART_RANGE = 60 * 60; // seconds
const UPDATE_INTERVAL = 1000; // milliseconds

const dateFormat = uPlot.fmtDate('{DD}.{MM}.{YYYY} {H}:{mm}:{ss}');
const dateTimeZone = (ts) => uPlot.tzDate(new Date(ts * 1e3), 'Europe/Istanbul');

const chartOptions = {
    title: 'API Ortalama Yanıt Süresi',
    cursor: {
        drag: {
            setScale: false,
        }
    },
    select: {
        show: false,
    },
    series: [{
        label: 'Tarih',
        value: (u, ts) => dateFormat(dateTimeZone(ts)),
    }, {
        label: 'GET',
        stroke: 'green',
        fill: 'rgba(0, 255, 0, 0.1)',
        value: (u, v) => v == null ? '-' : v + ' ms',
    }, {
        label: 'POST',
        stroke: 'blue',
        fill: 'rgba(0, 0, 255, 0.1)',
        value: (u, v) => v == null ? '-' : v + ' ms',
    }, {
        label: 'PUT',
        stroke: 'orange',
        fill: 'rgba(255, 165, 0, 0.1)',
        value: (u, v) => v == null ? '-' : v + ' ms',
    }, {
        label: 'DELETE',
        stroke: 'red',
        fill: 'rgba(255, 0, 0, 0.1)',
        value: (u, v) => v == null ? '-' : v + ' ms',
    }],
    axes: [{
            values: [
                [3600 * 24 * 365, '{YYYY}'],
                [3600 * 24 * 28, '{MM}'],
                [3600 * 24, '{MM}.{DD}'],
                [3600, '{H}'],
                [60, '{H}:{mm}:{ss}'],
                [1, '{H}:{mm}:{ss}'],
                [0.001, ':{ss}.{fff}'],
            ],
        },
        {
            size: 70,
            values: (u, vals, space) => vals.map(v => +v + ' ms'),
        },
    ],
    ...getChartSize()
};

let chartRange = MAX_CHART_RANGE;
let dataInterval = 15;
let lastLogId;
let logsContainer = [];
let pruneTimer = 0;

function updateSettings() {
    chartRange = parseInt(document.getElementById('chartRange').value) * 60;
    dataInterval = parseInt(document.getElementById('dataInterval').value);
    document.getElementById('chartRangeLabel').innerHTML = chartRange / 60;
    document.getElementById('dataIntervalLabel').innerHTML = dataInterval;
    fetchChartData(true);
}

function average(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum = sum + array[i];
    }
    return sum / array.length;
}

function generateChartData(logs) {
    const currTimestamp = Math.floor(Date.now() / 1000);
    let startTimestamp = currTimestamp - chartRange;

    if (startTimestamp % dataInterval != 0) {
        startTimestamp = startTimestamp - (startTimestamp % dataInterval);
    }

    let dataSeries = {};
    for (let index = startTimestamp; index <= currTimestamp; index += dataInterval) {
        dataSeries[index] = {
            GET: [],
            POST: [],
            PUT: [],
            DELETE: [],
        };
    }

    logs.forEach(log => {
        let timestamp = Date.parse(log.timestamp) / 1000;
        let index = timestamp - (timestamp % dataInterval);
        if (index in dataSeries == false) return;
        dataSeries[index][log.method].push(log.delay);
    });

    let chartData = [
        [],
        [],
        [],
        [],
        []
    ];

    Object.keys(dataSeries).forEach(timestamp => {
        chartData[0].push(parseInt(timestamp));
        chartData[1].push(Math.round(average(dataSeries[timestamp].GET) || 0));
        chartData[2].push(Math.round(average(dataSeries[timestamp].POST) || 0));
        chartData[3].push(Math.round(average(dataSeries[timestamp].PUT) || 0));
        chartData[4].push(Math.round(average(dataSeries[timestamp].DELETE) || 0));
    });

    return chartData;
}

function pruneOldLogs() {
    const startTimestamp = Date.now() - (MAX_CHART_RANGE * 1000);
    let oldIndex = 0;
    for (let i = 0; i < logsContainer.length - MAX_OLD_LOG; i += MAX_OLD_LOG) {
        let logTimestamp = Date.parse(logsContainer[i].timestamp);
        if (logTimestamp < startTimestamp) {
            oldIndex = i
        } else {
            if (i > 0) {
                logsContainer = logsContainer.slice(oldIndex - logsContainer.length);
            }
            break;
        }
    }
}

function fetchChartData(useCache = false) {
    if (useCache) {
        const chartData = generateChartData(logsContainer);
        chart.setData(chartData);
    } else {
        fetch('api/logs?afterId=' + lastLogId).then(r => r.json()).then(result => {
            if (result.lastLogId) {
                lastLogId = result.lastLogId;
                logsContainer = logsContainer.concat(result.logs);
                if (++pruneTimer == 60) {
                    pruneTimer = 0;
                    pruneOldLogs();
                }
            }
            const chartData = generateChartData(logsContainer);
            chart.setData(chartData);
            setTimeout(fetchChartData, UPDATE_INTERVAL);
        }).catch(err => {
            console.error(err);
            setTimeout(fetchChartData, UPDATE_INTERVAL * 5);
        });
    }
}

function getChartSize() {
    let container = document.getElementById('chartContainer');
    return {
        width: container.offsetWidth - (24 * 2),
        height: 300
    }
}

const chart = new uPlot(chartOptions, null, document.getElementById('chart'));
fetchChartData();

document.getElementById('chartRange').addEventListener('input', updateSettings);
document.getElementById('dataInterval').addEventListener('input', updateSettings);
window.addEventListener('resize', () => {
    chart.setSize(getChartSize());
});