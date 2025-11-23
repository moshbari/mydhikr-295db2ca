import * as React from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [shouldTrigger, setShouldTrigger] = React.useState(false);
  const y = useMotionValue(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Transform the pull distance to rotation for the icon
  const rotate = useTransform(y, [0, threshold], [0, 360]);
  const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);

  const handleDragStart = () => {
    // Only allow pull-to-refresh if at the top of the page
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      return true;
    }
    return false;
  };

  const handleDrag = (_: any, info: PanInfo) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    // Only allow dragging down
    if (info.offset.y > 0) {
      y.set(Math.min(info.offset.y, threshold * 1.5));
      
      // Trigger haptic when crossing threshold
      if (info.offset.y >= threshold && !shouldTrigger) {
        setShouldTrigger(true);
        haptics.light();
      } else if (info.offset.y < threshold && shouldTrigger) {
        setShouldTrigger(false);
      }
    }
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    if (info.offset.y >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      haptics.medium();
      
      try {
        await onRefresh();
        haptics.success();
      } catch (error) {
        haptics.error();
      } finally {
        setIsRefreshing(false);
        setShouldTrigger(false);
      }
    }

    y.set(0);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative min-h-0 overflow-y-auto", className)}
    >
      {/* Pull indicator */}
      <motion.div
        style={{ y, opacity }}
        className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-10"
      >
        <motion.div
          style={{ rotate }}
          className={cn(
            "mt-4 p-2 rounded-full bg-primary/10 backdrop-blur-sm",
            isRefreshing && "animate-spin"
          )}
        >
          <RefreshCw
            className={cn(
              "h-5 w-5 text-primary",
              shouldTrigger && "text-primary"
            )}
          />
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
      >
        {children}
      </motion.div>
    </div>
  );
}
