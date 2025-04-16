import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, Time, ISeriesApi, IChartApi, LineSeries } from 'lightweight-charts';
import { ChartData } from '../../services/statisticsService';

interface PortfolioChartProps {
  data: ChartData;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  // Helper function to format Date object or parseable string to 'YYYY-MM-DD'
  const formatDate = (dateInput: unknown): string | null => {
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

  // Transform data for lightweight-charts
  const getSeriesData = () => {
    // console.log("[PortfolioChart] Original data.labels:", data.labels); // Log original labels <-- REMOVE

    const mappedData = data.labels
      .map((label, i) => {
        const formattedTime = formatDate(label);
        // console.log(`[PortfolioChart] Processing label: ${JSON.stringify(label)}, Formatted time: ${formattedTime}`); // Log formatting result <-- REMOVE

        if (!formattedTime) {
          // console.warn(`[PortfolioChart] Invalid date format for label: ${JSON.stringify(label)} at index ${i}. Skipping point.`); // Keep warn, but maybe less verbose
          console.warn(`[PortfolioChart] Skipping invalid date label at index ${i}:`, label);
          return null; // Indicate invalid point
        }

        return {
          time: formattedTime as Time, // Now guaranteed to be 'YYYY-MM-DD'
          btc: data.btcValues[i],
          // collateral: data.collateralValues[i], // <-- REMOVE collateral from returned object
          czk: data.czkValues[i],
        };
      });

    const filteredData = mappedData.filter(point => point !== null); // Remove invalid points

    const sortedData = filteredData.sort((a, b) => {
        // Sort based on the 'YYYY-MM-DD' string time
        // Need to cast back to non-null because filter removed nulls
        const timeA = (a!).time as string;
        const timeB = (b!).time as string;
        return timeA.localeCompare(timeB);
      });

    // console.log("[PortfolioChart] Final series data:", sortedData); // Log final data <-- REMOVE
    return sortedData;
  };

  useEffect(() => {
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
    // Free Collateral (line) <-- REMOVE collateral series creation
    // const collateralSeries = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 2 });

    // Prepare data
    const seriesData = getSeriesData();
    // Remove null assertion `!` as filter guarantees non-null, but map still needs it inside
    czkSeries.setData(seriesData.map(d => ({ time: d!.time, value: d!.czk })));
    btcSeries.setData(seriesData.map(d => ({ time: d!.time, value: d!.btc })));
    // collateralSeries.setData(seriesData.map(d => ({ time: d.time, value: d.collateral }))); <-- REMOVE collateral setData

    // Set visible range to start from the first data point
    if (seriesData.length > 0) {
      // Add ! to assert non-null for array elements due to TS compiler strictness in build env
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
      // Use chartRef.current to safely access the chart instance
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
      // chartRef.current = null; // Let's keep this commented out for now, it might not be necessary
    };
  }, [data]);

  // Return only the chart container
  return (
      <div ref={chartContainerRef} style={{ width: '100%', minHeight: 320 }} />
  );
};

export default PortfolioChart; 