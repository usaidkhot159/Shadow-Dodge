export class CollisionDetector {
  /**
   * Circle vs Circle — returns true if overlapping
   */
  circleCircle(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (a.radius + b.radius) * 0.85; // slightly forgiving
  }

  /**
   * Push a circle out of an axis-aligned rect
   */
  pushOutRect(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const dist = Math.hypot(dx, dy);
    if (dist < circle.radius && dist > 0) {
      const push = (circle.radius - dist) / dist;
      circle.x += dx * push;
      circle.y += dy * push;
    }
  }

  /**
   * Point inside rect
   */
  pointRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w &&
           py >= rect.y && py <= rect.y + rect.h;
  }
}
