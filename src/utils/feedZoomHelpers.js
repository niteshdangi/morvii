import { UIManager } from "react-native";
export default function measureNode(node) {
  return new Promise((resolve, reject) => {
    UIManager.measureLayoutRelativeToParent(
      node,
      (e) => reject(e),
      (x, y, w, h) => {
        resolve({ x, y, w, h });
      }
    );
  });
}

const SCALE_MULTIPLIER = 1.2;

export function getScale(currentDistance, initialDistance) {
  return (currentDistance / initialDistance) * SCALE_MULTIPLIER;
}

export function pow2abs(a, b) {
  return Math.pow(Math.abs(a - b), 2);
}

export function getDistance(touches) {
  const [a, b] = touches;
  if (a == null || b == null) {
    return 0;
  }
  return Math.sqrt(pow2abs(a.pageX, b.pageX) + pow2abs(a.pageY, b.pageY));
}
