/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UsagePoint } from '../types';

interface CustomChartProps {
  data: UsagePoint[];
  downloadMax: number;
  uploadMax: number;
}

export const CustomChart: React.FC<CustomChartProps> = ({ data, downloadMax, uploadMax }) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(downloadMax, ...data.map(d => d.download)) * 1.1;

  // Chart SVG dimensions
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Convert points to SVG coordinates
  const getCoordinates = (field: 'download' | 'upload') => {
    return data.map((point, index) => {
      const x = paddingX + (index / (data.length - 1)) * chartWidth;
      // Invert Y for SVG coords
      const y = height - paddingY - (point[field] / maxVal) * chartHeight;
      return { x, y };
    });
  };

  const dlPoints = getCoordinates('download');
  const ulPoints = getCoordinates('upload');

  const createLinePath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    return coords.reduce((acc, coord, idx) => {
      return idx === 0 ? `M ${coord.x} ${coord.y}` : `${acc} L ${coord.x} ${coord.y}`;
    }, '');
  };

  const createAreaPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    const startX = coords[0].x;
    const endX = coords[coords.length - 1].x;
    const groundY = height - paddingY;
    const linePath = createLinePath(coords);
    return `${linePath} L ${endX} ${groundY} L ${startX} ${groundY} Z`;
  };

  const dlLine = createLinePath(dlPoints);
  const dlArea = createAreaPath(dlPoints);

  const ulLine = createLinePath(ulPoints);
  const ulArea = createAreaPath(ulPoints);

  // Y-axis markers
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  return (
    <div id="traffic-chart-container" className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-inner relative overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Live Bandwidth Monitor</h4>
          <p className="text-[10px] text-slate-500 font-mono">Status: Terhubung ke OLT-04-A</p>
        </div>
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300">Unduh: <strong className="text-emerald-400">{data[data.length - 1]?.download} Mbps</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-slate-300">Unggah: <strong className="text-blue-400">{data[data.length - 1]?.upload} Mbps</strong></span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[180px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = height - paddingY - (tick / maxVal) * chartHeight;
            return (
              <g key={i} className="opacity-20">
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
                <text x={paddingX - 8} y={y + 4} fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="end">
                  {tick.toFixed(0)}M
                </text>
              </g>
            );
          })}

          {/* Time ticks on X-axis (showing every 3rd data point to prevent clutter) */}
          {data.map((point, index) => {
            if (index % 3 !== 0 && index !== data.length - 1) return null;
            const x = paddingX + (index / (data.length - 1)) * chartWidth;
            return (
              <text key={index} x={x} y={height - 4} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-80">
                {point.time.split(':').slice(1).join(':')}
              </text>
            );
          })}

          {/* Download Area with gradient */}
          <path d={dlArea} fill="url(#dlGrad)" />
          {/* Download Line */}
          <path d={dlLine} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Upload Area with gradient */}
          <path d={ulArea} fill="url(#ulGrad)" />
          {/* Upload Line */}
          <path d={ulLine} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Vertical indicator line at last data point */}
          {dlPoints.length > 0 && (
            <g>
              <line x1={dlPoints[dlPoints.length - 1].x} y1={paddingY} x2={dlPoints[dlPoints.length - 1].x} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2" className="opacity-40" />
              <circle cx={dlPoints[dlPoints.length - 1].x} cy={dlPoints[dlPoints.length - 1].y} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={ulPoints[ulPoints.length - 1].x} cy={ulPoints[ulPoints.length - 1].y} r="3" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
