"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  children: React.ReactNode
}

const PanelGroupContext = React.createContext<{
  orientation: "horizontal" | "vertical"
}>({
  orientation: "horizontal",
})

export function ResizablePanelGroup({
  className,
  orientation = "horizontal",
  children,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <PanelGroupContext.Provider value={{ orientation }}>
      <div
        data-slot="resizable-panel-group"
        className={cn(
          "flex h-full w-full min-w-0 min-h-0 overflow-hidden relative",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </PanelGroupContext.Provider>
  )
}

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number
  minSize?: number
  maxSize?: number
  children?: React.ReactNode
}

export function ResizablePanel({
  className,
  children,
  defaultSize,
  style,
  ...props
}: ResizablePanelProps) {
  return (
    <div
      data-slot="resizable-panel"
      style={{
        flex: defaultSize ? `${defaultSize} 1 0px` : "1 1 0px",
        minWidth: 0,
        minHeight: 0,
        ...style,
      }}
      className={cn(
        "h-full w-full min-w-0 min-h-0 flex flex-col overflow-hidden relative",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean
  onResize?: (delta: number) => void
}

export function ResizableHandle({
  withHandle,
  className,
  onResize,
  ...props
}: ResizableHandleProps) {
  const { orientation } = React.useContext(PanelGroupContext)
  const isHorizontal = orientation === "horizontal"

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = isHorizontal
        ? moveEvent.clientX - startX
        : moveEvent.clientY - startY
      onResize?.(delta)
    }

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  return (
    <div
      data-slot="resizable-handle"
      onPointerDown={handlePointerDown}
      className={cn(
        "relative flex items-center justify-center bg-border/80 transition-colors hover:bg-primary focus-visible:ring-1 select-none shrink-0 z-10",
        isHorizontal
          ? "w-[4px] h-full cursor-col-resize hover:w-[6px]"
          : "h-[4px] w-full cursor-row-resize hover:h-[6px]",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            "rounded-full bg-muted-foreground/40 hover:bg-primary transition-colors",
            isHorizontal ? "h-8 w-1" : "w-8 h-1"
          )}
        />
      )}
    </div>
  )
}
