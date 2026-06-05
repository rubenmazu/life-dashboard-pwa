import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DragSortableListProps<T extends { id?: string }> {
  items: T[];
  onReorder: (reorderedIds: string[]) => void;
  renderItem: (item: T) => React.ReactNode;
}

function SortableItem<T extends { id?: string }>({
  item,
  renderItem,
}: {
  item: T;
  renderItem: (item: T) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="ios-list-item gap-3"
      {...attributes}
    >
      {/* Drag handle - 3-line hamburger icon */}
      <button
        type="button"
        className="flex flex-col justify-center items-center gap-[3px] p-2 touch-none cursor-grab active:cursor-grabbing"
        style={{ minWidth: '24px', minHeight: 'var(--spacing-tap-target)' }}
        aria-label="Drag to reorder"
        {...listeners}
      >
        <span className="block w-4 h-[2px] rounded-full" style={{ backgroundColor: 'var(--color-ios-text-tertiary)' }} />
        <span className="block w-4 h-[2px] rounded-full" style={{ backgroundColor: 'var(--color-ios-text-tertiary)' }} />
        <span className="block w-4 h-[2px] rounded-full" style={{ backgroundColor: 'var(--color-ios-text-tertiary)' }} />
      </button>

      <div className="flex-1 min-w-0">
        {renderItem(item)}
      </div>
    </div>
  );
}

/**
 * Generic drag-and-drop sortable list using @dnd-kit.
 * Touch-friendly with proper handle area and visual drag indicator (3-line hamburger).
 *
 * Requirements: 11.5, 11.6
 */
export function DragSortableList<T extends { id?: string }>({
  items,
  onReorder,
  renderItem,
}: DragSortableListProps<T>) {
  const [activeItems, setActiveItems] = useState<T[]>(items);

  // Update local state when items change externally
  if (items !== activeItems && JSON.stringify(items.map(i => i.id)) !== JSON.stringify(activeItems.map(i => i.id))) {
    setActiveItems(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeItems.findIndex((item) => item.id === active.id);
      const newIndex = activeItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(activeItems, oldIndex, newIndex);
      setActiveItems(newItems);
      onReorder(newItems.map((item) => item.id!));
    }
  }

  const itemIds = activeItems.map((item) => item.id!);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-ios-surface)' }}>
          {activeItems.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
