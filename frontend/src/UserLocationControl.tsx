import { Control, DomEvent } from 'leaflet';
import { LocateFixed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';
import { cn } from '@/lib/utils';
import type { UserLocationState } from './useUserLocation';

const MESSAGES: Partial<Record<UserLocationState['status'], string>> = {
  locating: 'Procurando sua localização…',
  denied:
    'Permita o acesso à localização no navegador para ver onde você está.',
  unavailable: 'Não foi possível encontrar sua localização.',
  unsupported: 'Seu navegador não informa a localização.',
};

interface UserLocationControlProps {
  status: UserLocationState['status'];
  onLocate: () => void;
}

// A Leaflet control in the bottom left corner, so it stacks above the zoom
// buttons, with the button drawn by React inside it. A message beside the
// button says what went wrong, or that the location is on its way.
export function UserLocationControl({
  status,
  onLocate,
}: UserLocationControlProps) {
  const map = useMap();
  const [container] = useState(() => {
    const element = document.createElement('div');
    element.className = 'flex items-center gap-2';
    // Clicks on the button do not reach the map below it.
    DomEvent.disableClickPropagation(element);
    return element;
  });

  useEffect(() => {
    const control = new Control({ position: 'bottomleft' });
    control.onAdd = () => container;
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, container]);

  const message = MESSAGES[status];

  return createPortal(
    <>
      <div className="leaflet-bar">
        <button
          type="button"
          className="flex size-[30px] items-center justify-center rounded-[2px] bg-white text-black hover:bg-[#f4f4f4]"
          aria-label="Minha localização"
          title="Minha localização"
          aria-busy={status === 'locating'}
          onClick={onLocate}
        >
          <LocateFixed aria-hidden="true" className="size-[18px]" />
        </button>
      </div>
      {/* Always present, so screen readers announce the message. */}
      <p
        role="status"
        className={cn(
          'm-0 max-w-56 text-sm',
          message && 'rounded-sm bg-card px-3 py-1.5 shadow-(--shadow)',
          status !== 'locating' && 'font-semibold text-destructive',
        )}
      >
        {message}
      </p>
    </>,
    container,
  );
}
