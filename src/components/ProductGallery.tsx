"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = React.useState(0);
  const [zoom, setZoom] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 50, y: 50 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      <div className="flex gap-3 sm:flex-col">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            aria-label={`Image ${i + 1}`}
            className={cn("relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-colors sm:h-20 sm:w-20", active === i ? "border-accent" : "border-border hover:border-foreground/30")}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-contain p-1.5" />
          </button>
        ))}
      </div>

      <div
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
        className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-3xl border border-border bg-white"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={images[active]}
              alt={title}
              fill
              priority
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-contain p-6 transition-transform duration-200"
              style={zoom ? { transform: "scale(1.7)", transformOrigin: `${pos.x}% ${pos.y}%` } : undefined}
            />
          </motion.div>
        </AnimatePresence>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white backdrop-blur">
          Survolez pour zoomer
        </span>
      </div>
    </div>
  );
}
