import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export interface PlotlyGraphProps {
  data: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: React.CSSProperties;
  className?: string;
  onHover?: (event: Plotly.PlotHoverEvent) => void;
  onUnhover?: () => void;
  onClick?: (event: Plotly.PlotMouseEvent) => void;
}

export const PlotlyGraph: React.FC<PlotlyGraphProps> = ({
  data,
  layout,
  config,
  style,
  className,
  onHover,
  onUnhover,
  onClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const mergedConfig: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'pca_visualization_plot',
        height: 600,
        width: 800,
        scale: 2
      },
      ...config
    };

    const mergedLayout: Partial<Plotly.Layout> = {
      autosize: true,
      paper_bgcolor: 'transparent',
      plot_bgcolor: '#f8fafc',
      margin: { l: 55, r: 30, t: 40, b: 50 },
      font: {
        family: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#334155',
        size: 12
      },
      ...layout
    };

    Plotly.react(containerRef.current, data, mergedLayout, mergedConfig);

    const el = containerRef.current as any;
    if (el && el.on) {
      if (onHover) el.on('plotly_hover', onHover);
      if (onUnhover) el.on('plotly_unhover', onUnhover);
      if (onClick) el.on('plotly_click', onClick);
    }
  }, [data, layout, config]);

  // Handle responsive resize with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '400px', ...style }}
      className={className}
      data-testid="plotly-graph-container"
    />
  );
};
