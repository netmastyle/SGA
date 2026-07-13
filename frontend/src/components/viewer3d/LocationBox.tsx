import { useMemo, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { BoxGeometry } from 'three';
import type { LayoutItem } from './layout';
import { LOCATION_SIZE, STATUS_COLOR } from './layout';

interface LocationBoxProps {
  item: LayoutItem;
  selected: boolean;
  onSelect: (item: LayoutItem) => void;
}

export default function LocationBox({ item, selected, onSelect }: LocationBoxProps) {
  const [hovered, setHovered] = useState(false);
  const color = STATUS_COLOR[item.location.status] ?? '#8b97a6';
  const edgesGeometry = useMemo(() => new BoxGeometry(...LOCATION_SIZE), []);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    onSelect(item);
  }

  return (
    <mesh
      position={item.position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={LOCATION_SIZE} />
      <meshStandardMaterial
        color={color}
        opacity={hovered || selected ? 1 : 0.85}
        transparent
        emissive={selected ? '#ffffff' : '#000000'}
        emissiveIntensity={selected ? 0.3 : 0}
      />
      {(hovered || selected) && (
        <lineSegments>
          <edgesGeometry args={[edgesGeometry]} />
          <lineBasicMaterial color="#ffffff" />
        </lineSegments>
      )}
    </mesh>
  );
}
