import { useContext, useEffect, useRef } from 'react';

import Chart from 'chart.js/auto';
import crosshairPlugin from 'chartjs-plugin-crosshair';

import { ChartDataContext, CurrentJSONContext } from '../contexts/AppContext';

export default function Panel() {
    const { chartData } = useContext(ChartDataContext);
    const { currentJSON } = useContext(CurrentJSONContext);
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        if (chartRef.current && chartData.length > 0) {
            const ctx = chartRef.current.getContext('2d');

            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }

            if (ctx) {
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(54, 162, 235, 1)');
                gradient.addColorStop(1, 'rgba(54, 162, 235, 0)');

                chartInstanceRef.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map(data => data.x),
                        datasets: [{
                            label: currentJSON.unit,
                            data: chartData.map(data => data.y),
                            borderColor: 'steelblue',
                            backgroundColor: gradient,
                            fill: true,
                            pointRadius: 0
                        }],
                    },
                    options: {
                        responsive: true,
                        interaction: {
                            intersect: false,
                            mode: 'index',
                        },
                        scales: {
                            x: {
                                ticks: {
                                    autoSkip: true,
                                    maxRotation: 0,
                                    minRotation: 0,
                                },
                            },
                            y: {
                                beginAtZero: true
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            crosshair: {
                                line: {
                                    color: '#F66',
                                    width: 1
                                },
                                snap: true,
                                sync: {
                                    enabled: true,
                                    group: 1,
                                    suppressTooltips: false
                                },
                                callbacks: {
                                    beforeZoom: function (start, end) {
                                        return true;
                                    },
                                    afterZoom: function (start, end) {
                                    }
                                }
                            }
                        }
                    },
                    plugins: [crosshairPlugin]
                });
            }
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }

        };
    }, [chartData, currentJSON]);

    return (
        <div style={{ width: '100%' }}>
            <canvas ref={chartRef} style={{ width: '100%'}}></canvas>
        </div>
    );
}