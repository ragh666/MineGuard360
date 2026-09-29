import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

// 1. HEMM Dumper Silhouette
export const HemmDumperIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    {/* Mining Dumper truck side profile */}
    <path d="M2 13h15l3-5h2v6h-2a2.5 2.5 0 0 1-5 0H9a2.5 2.5 0 0 1-5 0H2v-1zm1-8h11l3 4H3V5zm3.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
  </svg>
);

// 2. Fog / Reduced Visibility (Circle with horizontal wavy bands)
export const FogVisibilityIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <circle cx="12" cy="12" r="9" opacity="0.3" fill="currentColor" />
    <path d="M6 9c2-1 4 1 6 0s4-1 6 0" />
    <path d="M5 12c2.5-1 5 1 7.5 0s5-1 6.5 0" />
    <path d="M6 15c2-1 4 1 6 0s4-1 6 0" />
  </svg>
);

// 3. Radar Sweep (Arc/cone with 2 concentric partial rings)
export const RadarSweepIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <path d="M12 21a9 9 0 0 0 9-9h-9V3a9 9 0 0 0-9 9" />
    <path d="M12 17a5 5 0 0 0 5-5h-5V7a5 5 0 0 0-5 5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

// 4. Safe Corridor (Narrow lane shape with directional arrowhead)
export const SafeCorridorIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <path d="M7 21L9 3" />
    <path d="M17 21L15 3" />
    <path d="M12 16V8m-3 3l3-3 3 3" />
  </svg>
);

// 5. Token / Block (Shield shape with check or cross)
export const TokenBlockIcon: React.FC<{ granted?: boolean } & IconProps> = ({
  granted = true,
  className = "w-6 h-6",
  size,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3z" />
    {granted ? (
      <path d="M9 12l2 2 4-4" />
    ) : (
      <path d="M9 9l6 6m0-6l-6 6" />
    )}
  </svg>
);

// 6. Blind Curve (Curved road segment)
export const BlindCurveIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <path d="M4 20c0-8.8 7.2-16 16-16" strokeWidth="3" />
    <path d="M4 14c0-5.5 4.5-10 10-10" strokeDasharray="2 2" />
  </svg>
);

// 7. Junction (Crossing road segments forming an X)
export const JunctionIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <path d="M12 2v20M2 12h20" strokeWidth="3" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

// 8. Highwall / Edge (Warning triangle merged with cliff edge)
export const HighwallEdgeIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <path d="M12 2L2 19h20L12 2z" />
    <path d="M2 22h7l2-3 4 3h7" strokeWidth="2" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
  </svg>
);

// 9. Narrow Road (Road lines converging inward)
export const NarrowRoadIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <path d="M4 21l6-18" />
    <path d="M20 21l-6-18" />
    <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="3 3" />
  </svg>
);

// 10. Braking (Circle with parallel skid marks)
export const BrakingIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M9 8v8" strokeWidth="3" />
    <path d="M15 8v8" strokeWidth="3" />
  </svg>
);

// 11. LoRa / Comms (Wide radiating signal arcs)
export const LoraCommsIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <circle cx="12" cy="18" r="2" fill="currentColor" />
    <path d="M7 13a7 7 0 0 1 10 0" strokeWidth="2.5" />
    <path d="M4 8a12 12 0 0 1 16 0" strokeWidth="2.5" />
  </svg>
);

// 12. CAN Bus (Two linked nodes connected by a line)
export const CanBusIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <circle cx="6" cy="12" r="3" fill="currentColor" />
    <circle cx="18" cy="12" r="3" fill="currentColor" />
    <line x1="9" y1="12" x2="15" y2="12" strokeWidth="3" />
    <path d="M6 6v3m0 6v3M18 6v3m0 6v3" />
  </svg>
);

// 13. Occupancy Grid (3x3 grid of mixed filled/empty squares)
export const OccupancyGridIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    width={size}
    height={size}
    {...props}
  >
    <rect x="3" y="3" width="5" height="5" rx="1" fillOpacity="0.4" />
    <rect x="10" y="3" width="5" height="5" rx="1" />
    <rect x="17" y="3" width="5" height="5" rx="1" fillOpacity="0.4" />
    <rect x="3" y="10" width="5" height="5" rx="1" />
    <rect x="10" y="10" width="5" height="5" rx="1" fillOpacity="0.2" />
    <rect x="17" y="10" width="5" height="5" rx="1" />
    <rect x="3" y="17" width="5" height="5" rx="1" fillOpacity="0.4" />
    <rect x="10" y="17" width="5" height="5" rx="1" fillOpacity="0.9" />
    <rect x="17" y="17" width="5" height="5" rx="1" fillOpacity="0.4" />
  </svg>
);

// 14. Rock / Static Obstacle
export const RockIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size} {...props}>
    <path d="M4 14l4-5 4 2 5-6 4 4v5H4z" />
    <path d="M8 20h12v-5H4v3a2 2 0 0 0 2 2z" />
  </svg>
);

// 15. Person
export const PersonIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size} {...props}>
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21v-5a4.5 4.5 0 0 1 9 0v5" />
    <path d="M8.5 13L5 9" />
    <path d="M15.5 13L19 9" />
  </svg>
);

// 16. Regular Vehicle
export const VehicleIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size} {...props}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

// 17. Unknown Obstacle (Question mark in a hexagon)
export const UnknownObstacleIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size} {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);
