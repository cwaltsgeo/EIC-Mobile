import { useContext, useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import { ChartDataContext, CurrentJSONContext } from '../contexts/AppContext';

export default function Panel({ selectedIndex }) {
    const { chartData } = useContext(ChartDataContext);
    const { currentJSON } = useContext(CurrentJSONContext);
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (chartRef.current && chartData.length > 0) {
            const ctx = chartRef.current.getContext('2d');

            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            if (ctx) {
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map(data => data.x),
                        datasets: [
                            {
                                label: 'SSP126',
                                data: chartData.map(data => data.heatmax_ssp126),
                                borderColor: selectedIndex === 0 ? 'steelblue' : 'rgba(239, 239, 240, 0.2)',
                                borderWidth: selectedIndex === 0 ? 2 : 0.5,
                                fill: false,
                                pointRadius: 0
                            },
                            {
                                label: 'SSP245',
                                data: chartData.map(data => data.heatmax_ssp245),
                                borderColor: selectedIndex === 1 ? 'green' : 'rgba(239, 239, 240, 0.2)',
                                borderWidth: selectedIndex === 1 ? 2 : 0.5,
                                fill: false,
                                pointRadius: 0
                            },
                            {
                                label: 'SSP370',
                                data: chartData.map(data => data.heatmax_ssp370),
                                borderColor: selectedIndex === 2 ? 'red' : 'rgba(239, 239, 240, 0.2)',
                                borderWidth: selectedIndex === 2 ? 2 : 0.5,
                                fill: false,
                                pointRadius: 0
                            },
                            {
                                label: 'SSP585',
                                data: chartData.map(data => data.heatmax_ssp585),
                                borderColor: selectedIndex === 3 ? 'DarkRed' : 'rgba(239, 239, 240, 0.2)',
                                borderWidth: selectedIndex === 3 ? 2 : 0.5,
                                fill: false,
                                pointRadius: 0
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        animation: false,
                        maintainAspectRatio: false,
                        interaction: {
                            intersect: false,
                            mode: 'index',
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: 'white',
                                    autoSkip: false,
                                    maxRotation: 0,
                                    minRotation: 0,
                                    callback: function(value, index, values) {
                                        const year = Number(this.getLabelForValue(value));
                                        if (year % 25 === 0) {
                                            return year;
                                        }
                                        return '';
                                    }
                                },
                            },
                            y: {
                                ticks: {
                                    color: 'white',
                                },
                                beginAtZero: false,
                            },
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            crosshair: {
                                line: {
                                    color: '#F66',
                                    width: 1,
                                },
                                snap: true,
                                sync: {
                                    enabled: true,
                                    group: 1,
                                    suppressTooltips: false,
                                },
                                callbacks: {
                                    beforeZoom: function (start, end) {
                                        return true;
                                    },
                                    afterZoom: function (start, end) {},
                                },
                            },
                        },
                    },
                    plugins: [crosshairPlugin],
                });

                setLoading(false);
            }
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [chartData, selectedIndex, currentJSON]);

    return (
        <div style={{ width: 'calc(100% - 32px)', height: '200px', position: 'relative' }}>
            <canvas ref={chartRef} style={{ width: '100%' }}></canvas>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1/4 bg-neutral-950 bg-opacity-90 rounded-md animate-pulse"></div>
                </div>
            )}
        </div>
    );

}
