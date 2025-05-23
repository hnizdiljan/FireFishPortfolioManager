import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, Time, IChartApi, LineSeries } from 'lightweight-charts';
import { ChartData } from '../../types';

interface PortfolioChartProps {
  data: ChartData;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    const czechMonths = [
      "leden", "únor", "březen", "duben", "květen", "červen",
      "červenec", "srpen", "září", "říjen", "listopad", "prosinec"
    ];

    const formatDate = (dateInput: unknown): string | null => {
      if (typeof dateInput === "string" && czechMonths.includes(dateInput.toLowerCase())) {
        // Use current year, or adjust as needed
        const year = new Date().getFullYear();
        const month = czechMonths.indexOf(dateInput.toLowerCase()) + 1;

        return `${year}-${month.toString().padStart(2, "0")}-01`;
      }
      try {
        const date = new Date(dateInput as string | number | Date);
        if (isNaN(date.getTime())) {
          return null; // Invalid date
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        return `${year}-${month}-${day}`;
      } catch (e) {
        return null; // Error during parsing
      }
    };

    const getSeriesData = () => {
      const mappedData = data.labels
        .map((label, i) => {
          const formattedTime = formatDate(label);
          if (!formattedTime) {
            console.warn(`[PortfolioChart] Skipping invalid date label at index ${i}:`, label);

            return null; // Indicate invalid point
          }

          return {
            time: formattedTime as Time, 
            btc: data.btcValues[i],
            czk: data.czkValues[i],
          };
        });
  
      const filteredData = mappedData.filter(point => point !== null);
  
      const sortedData = filteredData.sort((a, b) => {
          const timeA = (a!).time as string;
          const timeB = (b!).time as string;

          return timeA.localeCompare(timeB);
        });
  
      return sortedData;
    };

    if (!chartContainerRef.current) return;

    const chart: IChartApi = createChart(chartContainerRef.current, {
      height: 320,
      layout: { background: { type: ColorType.Solid, color: '#fff' }, textColor: '#222' },
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: true },
      timeScale: { timeVisible: true, secondsVisible: false },
      grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    // Portfolio value in CZK (line)
    const czkSeries = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, title: 'Portfolio CZK' });
    // Portfolio value in BTC (line)
    const btcSeries = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 2, title: 'Portfolio BTC' });

    // Prepare data
    const seriesData = getSeriesData();
    czkSeries.setData(seriesData.map(d => ({ time: d!.time, value: d!.czk })));
    btcSeries.setData(seriesData.map(d => ({ time: d!.time, value: d!.btc })));

    // Set visible range to start from the first data point
    if (seriesData.length > 0) {
      const firstTime = seriesData[0]!.time;
      const lastTime = seriesData[seriesData.length - 1]!.time;
      chart.timeScale().setVisibleRange({
        from: firstTime,
        to: lastTime,
      });
    }

    // Tooltip (basic)
    chart.subscribeCrosshairMove(param => {
      if (param.point && param.time) {
        // You can implement custom tooltip here if needed
      }
    });

    // Responsive resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize call

    // Cleanup function: remove the chart created in *this* effect run
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  // Return only the chart container
  return (
      <div ref={chartContainerRef} style={{ width: '100%', minHeight: 320 }} />
  );
};

export default PortfolioChart; 