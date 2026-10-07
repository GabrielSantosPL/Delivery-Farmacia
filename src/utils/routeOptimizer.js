// Otimizador de Rotas por Fila de Proximidade (Nearest-Neighbor Heuristic)
export function calculateDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function optimizeDeliveryQueue(startCoords, deliveryOrders) {
  if (!deliveryOrders || deliveryOrders.length === 0) {
    return { queue: [], totalDistanceKm: 0, estimatedMinutes: 0 };
  }

  const unvisited = [...deliveryOrders];
  const queue = [];
  let currentPos = startCoords || [-23.0885, -47.2185]; // Farmácia Central caso não tenha
  let totalKm = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const orderCoords = unvisited[i].patient?.coordinates || [-23.0885, -47.2185];
      const dist = calculateDistanceKm(currentPos, orderCoords);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const nextStop = unvisited.splice(nearestIndex, 1)[0];
    const stopCoords = nextStop.patient?.coordinates || [-23.0885, -47.2185];
    totalKm += minDistance;

    queue.push({
      order: nextStop,
      stopIndex: queue.length + 1,
      distanceFromPrevKm: minDistance,
      cumulativeKm: Number(totalKm.toFixed(2)),
      coords: stopCoords
    });

    currentPos = stopCoords;
  }

  // Estimativa de tempo: velocidade média de moto urbana em Indaiatuba ~ 28 km/h + 8 min por entrega
  const travelMinutes = Math.round((totalKm / 28) * 60);
  const stopMinutes = queue.length * 8;
  const estimatedMinutes = travelMinutes + stopMinutes;

  return {
    queue,
    totalDistanceKm: Number(totalKm.toFixed(2)),
    estimatedMinutes
  };
}
