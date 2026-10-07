import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// SVG Custom Markers
const createHubIcon = () => {
  return L.divIcon({
    className: 'custom-hub-icon',
    html: `
      <div style="background: #0284c7; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(2,132,199,0.5); border: 2px solid white; font-size: 18px;">
        🏥
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
};

const createDriverIcon = (driverName) => {
  return L.divIcon({
    className: 'custom-driver-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="background: #ea580c; color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(234,88,12,0.6); border: 2px solid white; font-size: 20px; animation: pulse 2s infinite;">
          🛵
        </div>
        <div style="background: #1e293b; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 10px; white-space: nowrap; margin-top: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          ${driverName || 'Motoboy'}
        </div>
      </div>
    `,
    iconSize: [40, 56],
    iconAnchor: [20, 24],
    popupAnchor: [0, -28]
  });
};

const createDestinationIcon = (label, stopNumber = null) => {
  return L.divIcon({
    className: 'custom-dest-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="background: ${stopNumber ? '#0284c7' : '#10b981'}; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(2,132,199,0.5); border: 2px solid white; font-size: ${stopNumber ? '13px' : '17px'}; font-weight: 800;">
          ${stopNumber ? `#${stopNumber}` : '🏠'}
        </div>
        <div style="background: #0f172a; color: #f8fafc; font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 8px; white-space: nowrap; margin-top: 2px;">
          ${label || 'Destino'}
        </div>
      </div>
    `,
    iconSize: [34, 50],
    iconAnchor: [17, 20],
    popupAnchor: [0, -24]
  });
};

export default function LeafletMap({
  center = [-23.0885, -47.2185], // Indaiatuba Centro
  zoom = 13,
  drivers = [],
  orders = [],
  hub = null,
  singleOrder = null,
  optimizedQueue = null, // Fila de paradas ordenada por proximidade
  height = '450px',
  onSimulateMove = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routesLayerRef = useRef(null);

  // Inicializa mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | SUS Indaiatuba'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Atualiza marcadores e rotas dinamicamente
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !routesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routesLayerRef.current.clearLayers();

    const bounds = [];

    // 1. Hub Farmácia Central de Indaiatuba
    if (hub && hub.coordinates) {
      const hubMarker = L.marker(hub.coordinates, { icon: createHubIcon() })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
            <strong style="color: #0284c7; font-size: 14px;">🏥 ${hub.name}</strong><br/>
            <span style="color: #64748b; font-size: 12px;">Ponto de Distribuição Municipal</span><br/>
            <span>${hub.address}</span>
          </div>
        `);
      hubMarker.addTo(markersLayerRef.current);
      bounds.push(hub.coordinates);
    }

    // Modo 1: Fila Otimizada por Proximidade (Entregador)
    if (optimizedQueue && optimizedQueue.length > 0) {
      const driver = drivers[0];
      const routePoints = [];

      if (driver && driver.currentLocation) {
        const driverMarker = L.marker(driver.currentLocation, { icon: createDriverIcon(driver.name.split(' ')[0]) })
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px;">
              <strong style="color: #ea580c;">🛵 Ponto de Partida / Localização</strong><br/>
              <b>${driver.name}</b> (${driver.vehicle})
            </div>
          `);
        driverMarker.addTo(markersLayerRef.current);
        bounds.push(driver.currentLocation);
        routePoints.push(driver.currentLocation);
      } else if (hub && hub.coordinates) {
        routePoints.push(hub.coordinates);
      }

      // Adiciona cada parada da fila ordenada por proximidade
      optimizedQueue.forEach(stop => {
        const stopCoords = stop.coords;
        const stopMarker = L.marker(stopCoords, {
          icon: createDestinationIcon(stop.order.patient?.name?.split(' ')[0], stop.stopIndex)
        }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px;">
            <strong style="color: #0284c7;">📍 Parada #${stop.stopIndex} na Fila Otimizada</strong><br/>
            <b>${stop.order.patient?.name}</b><br/>
            <span>${stop.order.patient?.address}, ${stop.order.patient?.neighborhood}</span><br/>
            <span>Distância do ponto anterior: <b>${stop.distanceFromPrevKm} km</b></span><br/>
            <span style="color: #10b981; font-weight: bold;">Pedido: ${stop.order.id}</span>
          </div>
        `);
        stopMarker.addTo(markersLayerRef.current);
        bounds.push(stopCoords);
        routePoints.push(stopCoords);
      });

      // Traça a polylinha da fila de entregas conectando na sequência ótima
      if (routePoints.length > 1) {
        const polyline = L.polyline(routePoints, {
          color: '#0284c7',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 6',
          lineJoin: 'round'
        });
        polyline.addTo(routesLayerRef.current);
      }
    } 
    // Modo 2: Pedido Único do Cidadão
    else if (singleOrder) {
      const orderCoords = singleOrder.patient?.coordinates || [-23.1145, -47.2340];
      const destMarker = L.marker(orderCoords, { icon: createDestinationIcon(singleOrder.patient?.name?.split(' ')[0]) })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px;">
            <strong style="color: #10b981;">🏠 Destino da Entrega</strong><br/>
            <b>${singleOrder.patient?.name}</b><br/>
            <span>${singleOrder.patient?.address}, ${singleOrder.patient?.neighborhood}</span><br/>
            <span style="font-weight: bold; color: #0284c7;">Pedido: ${singleOrder.id}</span>
          </div>
        `);
      destMarker.addTo(markersLayerRef.current);
      bounds.push(orderCoords);

      const driver = drivers.find(d => d.id === singleOrder.assignedDriverId) || drivers[0];
      if (driver && driver.currentLocation) {
        const driverMarker = L.marker(driver.currentLocation, { icon: createDriverIcon(driver.name.split(' ')[0]) })
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px;">
              <strong style="color: #ea580c;">🛵 Motoboy em Rota</strong><br/>
              <b>${driver.name}</b> (${driver.vehicle})
            </div>
          `);
        driverMarker.addTo(markersLayerRef.current);
        bounds.push(driver.currentLocation);

        if (hub && hub.coordinates) {
          const polyline = L.polyline([hub.coordinates, driver.currentLocation, orderCoords], {
            color: '#0284c7',
            weight: 4,
            opacity: 0.8,
            dashArray: '8, 8',
            lineJoin: 'round'
          });
          polyline.addTo(routesLayerRef.current);
        }
      }
    } 
    // Modo 3: Visão Geral da Frota (Gerente)
    else {
      drivers.forEach(driver => {
        if (driver.currentLocation) {
          const driverMarker = L.marker(driver.currentLocation, { icon: createDriverIcon(driver.name.split(' ')[0]) })
            .bindPopup(`
              <div style="font-family: sans-serif; font-size: 13px;">
                <strong style="color: #ea580c;">🛵 Entregador SUS Indaiatuba</strong><br/>
                <b>${driver.name}</b> (${driver.plate})<br/>
                <span>Status: <b style="color: #15803d;">${driver.status}</b></span>
              </div>
            `);
          driverMarker.addTo(markersLayerRef.current);
          bounds.push(driver.currentLocation);
        }
      });

      orders.forEach(order => {
        if (order.patient?.coordinates && ['EM_TRANSITO', 'PRONTO_ENTREGA', 'APROVADO'].includes(order.status)) {
          const destMarker = L.marker(order.patient.coordinates, { icon: createDestinationIcon(order.patient.name?.split(' ')[0]) })
            .bindPopup(`
              <div style="font-family: sans-serif; font-size: 13px;">
                <strong style="color: #10b981;">📦 Entrega: ${order.id}</strong><br/>
                <b>${order.patient.name}</b><br/>
                <span>${order.patient.neighborhood}</span><br/>
                <span>Status: <b>${order.status}</b></span>
              </div>
            `);
          destMarker.addTo(markersLayerRef.current);
          bounds.push(order.patient.coordinates);

          if (hub && hub.coordinates) {
            const line = L.polyline([hub.coordinates, order.patient.coordinates], {
              color: order.status === 'EM_TRANSITO' ? '#ea580c' : '#38bdf8',
              weight: 3,
              opacity: 0.6,
              dashArray: order.status === 'EM_TRANSITO' ? '6, 6' : null
            });
            line.addTo(routesLayerRef.current);
          }
        }
      });
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], zoom);
    }
  }, [drivers, orders, hub, singleOrder, optimizedQueue, zoom]);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      {onSimulateMove && (
        <button
          onClick={onSimulateMove}
          type="button"
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            zIndex: 1000,
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>⚡ Simular Deslocamento GPS</span>
        </button>
      )}
    </div>
  );
}
