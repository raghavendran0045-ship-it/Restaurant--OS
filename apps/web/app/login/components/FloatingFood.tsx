"use client";

import { useEffect, useState, type CSSProperties } from "react";

const restaurantItems = [
  "🍔", "🍕", "🍗", "🍟", "🍤", "🥘", "🍛", "🍜",
  "🍝", "🌮", "🥗", "🥪", "🍳", "🥑", "🍅", "🌶️",
  "🥕", "🌽", "🥦", "🍄", "🧅", "🧄", "🍋", "🍰",
  "🧁", "🍩", "🥤", "☕",
];

type FloatingItem = {
  id: number;
  emoji: string;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  driftX: number;
  driftY: number;
  depth: number;
  opacity: number;
};

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomItem(): string {
  return restaurantItems[
    Math.floor(Math.random() * restaurantItems.length)
  ] ?? "🍽️";
}

function createItem(id: number): FloatingItem {
  return {
    id,
    emoji: randomItem(),
    left: randomBetween(-5, 105),
    top: randomBetween(-5, 105),
    size: randomBetween(28, 64),
    duration: randomBetween(12, 24),
    delay: randomBetween(-24, 0),
    rotateX: randomBetween(-35, 35),
    rotateY: randomBetween(-180, 180),
    rotateZ: randomBetween(-35, 35),
    driftX: randomBetween(-180, 180),
    driftY: randomBetween(-220, 220),
    depth: randomBetween(0.4, 1.8),
    opacity: randomBetween(0.35, 0.85),
  };
}

export default function FloatingFood() {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    const initialItems = Array.from(
      { length: 24 },
      (_, index) => createItem(index)
    );

    setItems(initialItems);

    const interval = window.setInterval(() => {
      setItems((current) => {
        if (current.length === 0) {
          return current;
        }

        const randomIndex = Math.floor(
          Math.random() * current.length
        );

        return current.map((item, index) => {
          if (index !== randomIndex) {
            return item;
          }

          return createItem(item.id);
        });
      });
    }, 3500);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="floating-food-layer" aria-hidden="true">
      {items.map((food) => (
        <div
          key={food.id}
          className="floating-food"
          style={{
            "--food-left": `${food.left}%`,
            "--food-top": `${food.top}%`,
            "--food-size": `${food.size}px`,
            "--food-duration": `${food.duration}s`,
            "--food-delay": `${food.delay}s`,
            "--food-rotate-x": `${food.rotateX}deg`,
            "--food-rotate-y": `${food.rotateY}deg`,
            "--food-rotate-z": `${food.rotateZ}deg`,
            "--food-drift-x": `${food.driftX}px`,
            "--food-drift-y": `${food.driftY}px`,
            "--food-depth": food.depth,
            "--food-opacity": food.opacity,
          } as CSSProperties}
        >
          <span>{food.emoji}</span>
        </div>
      ))}

      <div className="ambient-orb orb-orange" />
      <div className="ambient-orb orb-purple" />
      <div className="ambient-orb orb-blue" />
    </div>
  );
}
