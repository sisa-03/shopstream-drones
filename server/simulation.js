// Simplified high-performance movement for stable localhost
export class PathFinder {
  findPath(start, end) {
    // Return a direct 2-point path to eliminate CPU blocking
    return [start, end];
  }
}

const LAT_MIN = 19.00;
const LAT_MAX = 19.15;
const LNG_MIN = 72.80;
const LNG_MAX = 72.95;
const GRID_SIZE = 50;

const toGrid = (lat, lng) => ({
  x: Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * GRID_SIZE))),
  y: Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * GRID_SIZE)))
});

const fromGrid = (x, y) => ({
  lat: LAT_MIN + (x / GRID_SIZE) * (LAT_MAX - LAT_MIN),
  lng: LNG_MIN + (y / GRID_SIZE) * (LNG_MAX - LNG_MIN)
});

const pathFinder = new PathFinder(GRID_SIZE);

// Drone Controller to handle autonomous state transitions
export const simulateDroneMovement = (drone, io) => {
  if (!drone.destination || drone.status === 'IDLE') return;

  // 1. Generate path if not already present
  if (!drone.path || drone.path.length === 0) {
    const start = toGrid(drone.position.lat, drone.position.lng);
    const end = toGrid(drone.destination.lat, drone.destination.lng);
    const gridPath = pathFinder.findPath(start, end);
    
    if (gridPath) {
      drone.path = gridPath.map(p => fromGrid(p.x, p.y));
      drone.pathIndex = 0;
      console.log(`[SIM] Flight Path generated for ${drone.droneId}: ${drone.path.length} points.`);
    } else {
      // Fallback to straight line if no path found
      drone.path = [drone.destination];
      drone.pathIndex = 0;
    }
  }

  // 2. Follow current path point
  const target = drone.path[drone.pathIndex];
  const dLat = target.lat - drone.position.lat;
  const dLng = target.lng - drone.position.lng;
  const distanceToTarget = Math.sqrt(dLat * dLat + dLng * dLng);

  const step = 0.0001; // Ultra-smooth movement for live monitoring

  if (distanceToTarget <= step) {
    // Snap to target to avoid overshooting
    drone.position.lat = target.lat;
    drone.position.lng = target.lng;
    
    // Reached current waypoint
    if (drone.pathIndex < drone.path.length - 1) {
      drone.pathIndex++;
    } else {
      // Reached final destination
      if (drone.status === 'EN_ROUTE' || drone.status === 'TAKEOFF') {
        drone.status = 'DELIVERING';
        drone.deliveryTimer = 6;
        drone.speed = 0;
        drone.altitude = 5;
        drone.path = null; 
      } else if (drone.status === 'DELIVERING') {
        if (drone.deliveryTimer > 0) {
          drone.deliveryTimer--;
        } else {
          drone.status = 'RETURNING';
          drone.destination = { lat: 19.0760, lng: 72.8777, address: 'Headquarters Base' };
          drone.path = null; 
          drone.altitude = 120;
        }
      } else if (drone.status === 'RETURNING') {
        drone.status = 'IDLE';
        drone.destination = null;
        drone.currentOrderId = null;
        drone.path = null;
        drone.speed = 0;
        drone.altitude = 0;
      }
    }
  } else {
    // Movement towards waypoint
    drone.position.lat += (dLat / distanceToTarget) * step;
    drone.position.lng += (dLng / distanceToTarget) * step;
    drone.battery -= 0.01;
    drone.speed = 85;
    drone.altitude = 120;
    if (drone.status === 'TAKEOFF') drone.status = 'EN_ROUTE';
  }

  io.emit('droneTelemetry', drone.toObject ? drone.toObject() : drone);
};
