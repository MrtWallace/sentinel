import { getStatusLabel } from "./StatusBadge";

if (getStatusLabel("confirm_needed") !== "MANUAL REVIEW") {
  throw new Error("Expected confirm_needed to use the unified manual review label.");
}

if (getStatusLabel("review") !== "MANUAL REVIEW") {
  throw new Error("Expected review to use the unified manual review label.");
}
