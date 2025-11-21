import * as React from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface SwipeableItemProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  disabled?: boolean;
}

export function SwipeableItem({
  children,
  onEdit,
  onDelete,
  className,
  disabled = false,
}: SwipeableItemProps) {
  const x = useMotionValue(0);
  const [isRevealed, setIsRevealed] = React.useState(false);
  
  // Transform for the background actions
  const editOpacity = useTransform(x, [0, 80], [0, 1]);
  const deleteOpacity = useTransform(x, [-80, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Swipe left to delete
    if (offset < -80 || velocity < -500) {
      setIsRevealed(true);
      x.set(-160);
      haptics.medium();
    }
    // Swipe right to edit
    else if (offset > 80 || velocity > 500) {
      setIsRevealed(true);
      x.set(160);
      haptics.medium();
    }
    // Snap back
    else {
      setIsRevealed(false);
      x.set(0);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      haptics.medium();
      onEdit();
    }
    x.set(0);
    setIsRevealed(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      haptics.heavy();
      onDelete();
    }
    x.set(0);
    setIsRevealed(false);
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between">
        {/* Edit Action (Left) */}
        {onEdit && (
          <motion.button
            style={{ opacity: editOpacity }}
            onClick={handleEdit}
            className="flex items-center justify-center h-full px-6 bg-blue-500 text-white"
          >
            <Edit className="h-5 w-5" />
          </motion.button>
        )}

        {/* Delete Action (Right) */}
        {onDelete && (
          <motion.button
            style={{ opacity: deleteOpacity }}
            onClick={handleDelete}
            className="flex items-center justify-center h-full px-6 bg-red-500 text-white ml-auto"
          >
            <Trash2 className="h-5 w-5" />
          </motion.button>
        )}
      </div>

      {/* Swipeable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: onDelete ? -160 : 0, right: onEdit ? 160 : 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-background touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
