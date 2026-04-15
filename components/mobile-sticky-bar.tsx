"use client";

/**
 * Sticky mobile bottom bar — intentionally disabled.
 *
 * Earlier iterations pinned a centered PreisAlarm wordmark to the
 * bottom of every mobile viewport. User feedback: the fixed element
 * adds visual noise without carrying any functional weight (all
 * utility actions already live in the mobile header row 1). The
 * component now returns `null` so we keep a stable import path
 * while fully hiding the bar on mobile. The body padding-bottom
 * reservation in layout.tsx has been removed accordingly.
 */
export function MobileStickyBar() {
  return null;
}
