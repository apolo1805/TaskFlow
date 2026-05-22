import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../../api/cardsApi';

interface Props {
  card:     Card;
  onDelete: () => void;
}

export default function CardItem({ card, onDelete }: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'card', card: card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg px-3 py-2.5 shadow-sm cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-700">{card.title}</p>
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-200 hover:text-red-500 transition text-xs opacity-0 group-hover:opacity-100"
        >
          ✕
        </button>
      </div>
      {card.dueDate && (
        <p className="text-xs text-gray-400 mt-1">
          {new Date(card.dueDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}