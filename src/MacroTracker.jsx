import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_FIELDS = [
  { key: "water", label: "Water", unit: "oz", enabled: true },
  { key: "calories", label: "Calories", unit: "kcal", enabled: true },
  { key: "protein", label: "Protein", unit: "g", enabled: true },
  { key: "fat", label: "Fat", unit: "g", enabled: true },
  { key: "carbs", label: "Carbs", unit: "g", enabled: true },
  { key: "fiber", label: "Fiber", unit: "g", enabled: true },
  { key: "potassium", label: "Potassium", unit: "mg", enabled: true },
  { key: "magnesium", label: "Magnesium", unit: "mg", enabled: true },
  { key: "vitaminC", label: "Vitamin C", unit: "mg", enabled: true },
  { key: "calcium", label: "Calcium", unit: "mg", enabled: true },
  { key: "iron", label: "Iron", unit: "mg", enabled: true },
  { key: "sodium", label: "Sodium", unit: "mg", enabled: true },
  { key: "sugar", label: "Sugar", unit: "g", enabled: false },
  { key: "saturatedFat", label: "Sat Fat", unit: "g", enabled: false },
  { key: "cholesterol", label: "Cholesterol", unit: "mg", enabled: false },
  { key: "vitaminA", label: "Vitamin A", unit: "mcg", enabled: false },
];

const DEFAULT_GOALS = {
  water: 100,
  calories: 2000,
  protein: 150,
  fat: 65,
  carbs: 250,
  fiber: 30,
  potassium: 2600,
  magnesium: 400,
  vitaminC: 90,
  calcium: 1000,
  iron: 18,
  sodium: 2300,
  sugar: 50,
  saturatedFat: 20,
  cholesterol: 300,
  vitaminA: 900,
};

const DEFAULT_CATEGORIES = [
  "Vegetables",
  "Lean Protein",
  "Healthy Fats",
  "Fruits",
  "Grains",
  "Dairy",
  "Snacks",
  "Other",
];

const MEAL_TAGS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍎" },
  { key: "preWorkout", label: "Pre-Workout", emoji: "💪" },
  { key: "other", label: "Other", emoji: "📦" },
];

const DEFAULT_SYMPTOMS = [
  { key: "dizzy", label: "Dizzy", emoji: "💫" },
  { key: "sleepy", label: "Sleepy", emoji: "😴" },
  { key: "energetic", label: "Energetic", emoji: "⚡" },
  { key: "shaky", label: "Shaky", emoji: "🫨" },
  { key: "fatigued", label: "Fatigued", emoji: "😩" },
  { key: "wellRested", label: "Well Rested", emoji: "😌" },
  { key: "cravingSnack", label: "Craving Snack", emoji: "🍪" },
];

const DEFAULT_CALORIE_PLAN = {
  weeklyRate: 0,        // lbs/week, negative = lose
  protein: 150,         // g/day fixed
  fat: 65,              // g/day fixed
  cyclingEnabled: false,
  dayTypes: [
    { name: "Training", calOffset: 200, proteinMult: 1.0, fatMult: 0.8 },
    { name: "Rest", calOffset: -100, proteinMult: 1.0, fatMult: 1.1 },
  ],
  weekSchedule: { MO: "Rest", TU: "Rest", WE: "Rest", TH: "Rest", FR: "Rest", SA: "Rest", SU: "Rest" },
};

const STORAGE_KEYS = {
  foods: "mt_foods",
  logs: "mt_logs",
  fields: "mt_fields",
  customFields: "mt_custom_fields",
  goals: "mt_goals",
  categories: "mt_categories",
  weightLog: "mt_weight_log",
  bounds: "mt_bounds",
  symptomLog: "mt_symptom_log",
  caloriePlan: "mt_calorie_plan",
  bowelLog: "mt_bowel_log",
};

const TABS = ["today", "weight", "symptoms", "bowel", "foods", "stats", "settings"];
const TAB_LABELS = { today: "Today", weight: "Weight", symptoms: "Notes", bowel: "Bowel", foods: "Foods", stats: "Stats", settings: "Settings" };
const TAB_ICONS = {
  today: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  weight: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  symptoms: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  bowel: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  foods: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  stats: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(str) {
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ─── Weight Smoothing & TDEE ─────────────────────────────────────

function computeSmoothedWeights(weightLog) {
  // weightLog is { "2026-03-01": 185.2, "2026-03-02": 184.8, ... }
  const sortedDays = Object.keys(weightLog).sort();
  if (sortedDays.length === 0) return [];

  const alpha = 0.1; // EMA smoothing factor — lower = smoother
  const results = [];
  let ema = weightLog[sortedDays[0]];

  for (const day of sortedDays) {
    const raw = weightLog[day];
    ema = alpha * raw + (1 - alpha) * ema;
    results.push({ date: day, raw, smoothed: Math.round(ema * 100) / 100 });
  }
  return results;
}

function computeTDEE(smoothedWeights, logs, allFields, foods, numDays = 28) {
  // Need at least 2 weeks of data for meaningful results
  if (smoothedWeights.length < 14) return null;

  const endIdx = smoothedWeights.length - 1;
  const startIdx = Math.max(0, endIdx - numDays);
  const startEntry = smoothedWeights[startIdx];
  const endEntry = smoothedWeights[endIdx];

  const startDate = new Date(startEntry.date + "T12:00:00");
  const endDate = new Date(endEntry.date + "T12:00:00");
  const actualDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  if (actualDays < 14) return null;

  const weightChangeLbs = endEntry.smoothed - startEntry.smoothed;
  // 3500 kcal per pound of body weight change (widely used approximation)
  const caloricSurplusDeficit = (weightChangeLbs * 3500) / actualDays;

  // Compute average daily calories consumed over the same period
  const daysInRange = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    daysInRange.push(ds);
  }

  let totalCalories = 0;
  let daysWithFood = 0;
  for (const day of daysInRange) {
    const entries = logs[day];
    if (!entries || entries.length === 0) continue;
    let dayCals = 0;
    for (const entry of entries) {
      if (entry.isQuickAdd) {
        dayCals += entry.values?.calories || 0;
      } else {
        const food = foods.find(f => f.id === entry.foodId);
        if (food) dayCals += (food.nutrition?.calories || 0) * entry.servings;
      }
    }
    totalCalories += dayCals;
    daysWithFood++;
  }

  if (daysWithFood < 7) return null; // Need at least a week of food logging

  const avgDailyCalories = totalCalories / daysWithFood;
  // TDEE = what you ate - the deficit (or + the surplus)
  // If you lost weight, caloricSurplusDeficit is negative, so TDEE > intake
  const tdee = avgDailyCalories - caloricSurplusDeficit;

  const weeklyRateLbs = (weightChangeLbs / actualDays) * 7;

  return {
    tdee: Math.round(tdee),
    avgDailyCalories: Math.round(avgDailyCalories),
    weightChangeLbs: Math.round(weightChangeLbs * 100) / 100,
    weeklyRateLbs: Math.round(weeklyRateLbs * 100) / 100,
    daysAnalyzed: Math.round(actualDays),
    daysWithFoodLog: daysWithFood,
    startWeight: startEntry.smoothed,
    endWeight: endEntry.smoothed,
  };
}

function computeTDEEProgress(weightLog, logs) {
  const weightDays = Object.keys(weightLog).length;
  const foodDays = Object.values(logs).filter(entries => entries && entries.length > 0).length;
  const weightNeeded = Math.max(0, 14 - weightDays);
  const foodNeeded = Math.max(0, 7 - foodDays);
  const ready = weightNeeded === 0 && foodNeeded === 0;
  return { weightDays, foodDays, weightNeeded, foodNeeded, ready };
}

function computePlanTargets(caloriePlan, tdee, dateStr) {
  if (!tdee || tdee <= 0) return null;

  const dailyDeficit = (parseFloat(caloriePlan.weeklyRate) || 0) * 500;
  const baseTarget = Math.round(tdee + dailyDeficit);
  const protein = caloriePlan.protein || 150;
  const fat = caloriePlan.fat || 65;

  if (!caloriePlan.cyclingEnabled) {
    const proteinCals = protein * 4;
    const fatCals = fat * 9;
    const carbCals = Math.max(0, baseTarget - proteinCals - fatCals);
    const carbs = Math.round(carbCals / 4);
    return { calories: baseTarget, protein, fat, carbs };
  }

  // Cycling mode: get raw plan target for this day type
  const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const d = new Date(dateStr + "T12:00:00");
  const dow = dayNames[d.getDay()];
  const typeName = caloriePlan.weekSchedule?.[dow] || "Rest";
  const dayType = (caloriePlan.dayTypes || []).find(t => t.name === typeName) || { calOffset: 0, proteinMult: 1, fatMult: 1 };

  // Manual mode: return absolute targets directly
  if (dayType.mode === "manual") {
    const manualCals = dayType.manualCalories || baseTarget;
    const manualProtein = dayType.manualProtein || protein;
    const manualFat = dayType.manualFat || fat;
    const manualCarbs = dayType.manualCarbs !== undefined ? dayType.manualCarbs : Math.round(Math.max(0, manualCals - manualProtein * 4 - manualFat * 9) / 4);
    return {
      calories: manualCals,
      protein: manualProtein,
      fat: manualFat,
      carbs: manualCarbs,
      dayType: typeName,
      isManual: true,
      manualOverrides: dayType.manualOverrides || {},
    };
  }

  // Relative mode: use offsets and multipliers
  const schedule = caloriePlan.weekSchedule || {};
  const types = caloriePlan.dayTypes || [];
  let totalOffset = 0;
  for (const key of dayNames) {
    const tn = schedule[key] || "Rest";
    const dt = types.find(t => t.name === tn) || { calOffset: 0 };
    if (dt.mode === "manual") {
      totalOffset += ((dt.manualCalories || baseTarget) - baseTarget);
    } else {
      totalOffset += (dt.calOffset || 0);
    }
  }
  const avgOffset = totalOffset / 7;
  const adjustedTarget = Math.round(baseTarget + (dayType.calOffset || 0) - avgOffset);

  const adjProtein = Math.round(protein * (dayType.proteinMult || 1));
  const adjFat = Math.round(fat * (dayType.fatMult || 1));
  const proteinCals = adjProtein * 4;
  const fatCals = adjFat * 9;
  const carbCals = Math.max(0, adjustedTarget - proteinCals - fatCals);
  const carbs = Math.round(carbCals / 4);

  return { calories: adjustedTarget, protein: adjProtein, fat: adjFat, carbs, dayType: typeName };
}

// Get the Monday of the week containing dateStr
function getWeekMonday(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDays(mondayStr) {
  const days = [];
  const d = new Date(mondayStr + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 1);
  }
  return days; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

function computeWeeklyPlan(caloriePlan, tdee, viewDate, logs, foods, allFields) {
  if (!tdee || tdee <= 0) return null;

  const monday = getWeekMonday(viewDate);
  const weekDays = getWeekDays(monday);
  const today = todayStr();

  // Compute raw plan targets for each day
  const rawTargets = weekDays.map(day => computePlanTargets(caloriePlan, tdee, day));
  if (rawTargets.some(t => !t)) return null;

  const weeklyCalTarget = rawTargets.reduce((s, t) => s + t.calories, 0);

  // Compute actuals for each day
  const actuals = weekDays.map(day => {
    const entries = logs[day] || [];
    let cals = 0;
    entries.forEach(entry => {
      if (entry.isQuickAdd) {
        cals += entry.values?.calories || 0;
      } else {
        const food = foods.find(f => f.id === entry.foodId);
        if (food) cals += (food.nutrition?.calories || 0) * entry.servings;
      }
    });
    return cals;
  });

  // Determine which days are "past" (before viewDate) and which are "remaining" (viewDate onward)
  const viewIdx = weekDays.indexOf(viewDate);
  const pastDays = viewIdx >= 0 ? weekDays.slice(0, viewIdx) : [];
  const remainingDays = viewIdx >= 0 ? weekDays.slice(viewIdx) : weekDays;

  const pastActualCals = pastDays.reduce((s, day) => {
    const idx = weekDays.indexOf(day);
    return s + actuals[idx];
  }, 0);

  const remainingBudget = weeklyCalTarget - pastActualCals;

  // Get the raw planned cals for remaining days
  // Manual day types are fixed — subtract them from budget and only scale relative types
  const remainingRawTargets = remainingDays.map(day => {
    const idx = weekDays.indexOf(day);
    return rawTargets[idx];
  });
  const manualFixedCals = remainingRawTargets.filter(t => t.isManual).reduce((s, t) => s + t.calories, 0);
  const relativeRawSum = remainingRawTargets.filter(t => !t.isManual).reduce((s, t) => s + t.calories, 0);
  const budgetForRelative = remainingBudget - manualFixedCals;

  // Proportional scale factor — only applies to relative day types
  const scaleFactor = relativeRawSum > 0 ? budgetForRelative / relativeRawSum : 1;

  // Compute adjusted targets for each remaining day
  const protein = caloriePlan.protein || 150;
  const fat = caloriePlan.fat || 65;
  const adjustedTargets = {};

  remainingDays.forEach(day => {
    const idx = weekDays.indexOf(day);
    const raw = rawTargets[idx];

    // Manual day types don't get scaled — they keep their absolute values
    if (raw.isManual) {
      adjustedTargets[day] = {
        calories: raw.calories,
        protein: raw.protein,
        fat: raw.fat,
        carbs: raw.carbs,
        dayType: raw.dayType,
        isAdjusted: false,
        rawCalories: raw.calories,
        manualOverrides: raw.manualOverrides,
        isManual: true,
      };
      return;
    }

    const adjCals = Math.round(raw.calories * scaleFactor);

    // Scale protein and fat multipliers proportionally too
    const pMult = raw.protein / protein; // recover the day-type multiplier
    const fMult = raw.fat / fat;
    const adjProtein = Math.round(protein * pMult * scaleFactor);
    const adjFat = Math.round(fat * fMult * scaleFactor);

    // But floor protein at 80% of base to prevent going too low
    const finalProtein = Math.max(Math.round(protein * pMult * 0.8), adjProtein > 0 ? adjProtein : 0);
    // Recalculate fat from remaining after protein
    const finalFat = Math.round(fat * fMult * scaleFactor);
    const proteinCals = finalProtein * 4;
    const fatCals = finalFat * 9;
    const carbCals = Math.max(0, adjCals - proteinCals - fatCals);
    const carbs = Math.round(carbCals / 4);

    adjustedTargets[day] = {
      calories: adjCals,
      protein: finalProtein,
      fat: finalFat,
      carbs,
      dayType: raw.dayType,
      isAdjusted: Math.abs(scaleFactor - 1) > 0.01,
      rawCalories: raw.calories,
    };
  });

  return {
    weekDays,
    monday,
    rawTargets,
    actuals,
    weeklyCalTarget,
    pastActualCals,
    remainingBudget,
    remainingDays: remainingDays.length,
    scaleFactor,
    adjustedTargets,
    viewDayTargets: adjustedTargets[viewDate] || null,
  };
}

// ─── Reusable Components ─────────────────────────────────────────

function Icon({ path, size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", opacity: 0.5 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, fontFamily: "var(--font-heading)" }}>{title}</div>
      <div style={{ fontSize: 13, fontFamily: "var(--font-body)" }}>{subtitle}</div>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width: "100%", maxWidth: 480, maxHeight: "85vh", background: "var(--card-bg)",
        borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.2)"
      }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 16px" }} />
        {title && <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: "var(--font-heading)", color: "var(--text)" }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, type = "text", placeholder, unit, step }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--text-muted)", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label} {unit && <span style={{ fontWeight: 400, textTransform: "none" }}>({unit})</span>}
      </label>
      <input
        type={type} inputMode={type === "number" ? "decimal" : undefined} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} step={step}
        style={{
          width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 10,
          fontSize: 15, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)",
          outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = "var(--accent)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", style: s = {}, disabled }) {
  const base = {
    padding: "11px 20px", borderRadius: 12, fontSize: 14, fontWeight: 650, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "var(--font-body)", transition: "all 0.2s", opacity: disabled ? 0.4 : 1, width: "100%", ...s,
  };
  const variants = {
    primary: { background: "var(--accent)", color: "#fff" },
    secondary: { background: "var(--border)", color: "var(--text)" },
    danger: { background: "#ff4444", color: "#fff" },
    ghost: { background: "transparent", color: "var(--accent)", padding: "8px 12px" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

// ─── Progress Bar Component ──────────────────────────────────────

function ProgressBar({ field, current, goal, isCalories, lower, upper }) {
  const hasLower = lower !== undefined && lower > 0;
  const hasUpper = upper !== undefined && upper > 0;
  // Bar fills up to the upper bound if set, otherwise the goal
  const barMax = hasUpper ? upper : (goal > 0 ? goal : Math.max(current, 1));
  const pct = barMax > 0 ? Math.min((current / barMax) * 100, 100) : 0;
  const over = barMax > 0 && current > barMax;
  const rounded = Math.round(current * 10) / 10;
  const bgColor = isCalories ? "#E8672E" : "var(--card-bg)";
  const textColor = isCalories ? "#fff" : "var(--text)";
  const mutedColor = isCalories ? "rgba(255,255,255,0.6)" : "var(--text-muted)";
  const barBg = isCalories ? "rgba(255,255,255,0.2)" : "var(--border)";

  const inRange = (!hasLower || current >= lower) && (!hasUpper || current <= upper);

  let barFill;
  if (isCalories) {
    barFill = "#fff";
  } else if (hasLower || hasUpper) {
    barFill = inRange ? "#22C55E" : "#B0B8C4";
  } else {
    barFill = "#3B82F6";
  }

  // Tick positions relative to barMax
  const lowerPct = (hasLower && barMax > 0) ? Math.min((lower / barMax) * 100, 100) : null;
  const upperPct = (hasUpper && barMax > 0) ? 100 : null; // upper is always at the end since it IS the max
  const tickColor = isCalories ? "rgba(255,255,255,0.5)" : "#555";

  return (
    <div style={{
      background: bgColor,
      borderRadius: 14,
      padding: "12px 16px",
      marginBottom: 8,
      boxShadow: isCalories ? "0 4px 20px rgba(232,103,46,0.25)" : "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{field.label}</span>
        <div style={{ fontSize: 12, color: mutedColor }}>
          <span style={{ fontSize: isCalories ? 18 : 15, fontWeight: 700, fontFamily: "var(--font-heading)", color: textColor }}>
            {rounded}
          </span>
          <span style={{ margin: "0 3px" }}>/</span>
          <span style={{ fontWeight: 500 }}>{hasUpper ? upper : goal}{field.unit}</span>
        </div>
      </div>
      {/* Bar with markers */}
      <div style={{ position: "relative", height: 6, borderRadius: 3, background: barBg, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 3,
          background: barFill,
          transition: "width 0.4s ease-out, background 0.3s ease",
        }} />
        {/* Lower bound tick */}
        {lowerPct !== null && (
          <div style={{
            position: "absolute", top: 0, left: `${lowerPct}%`, transform: "translateX(-50%)",
            width: 2, height: 6, zIndex: 2,
            background: tickColor,
          }} />
        )}
      </div>
      {/* Bottom row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: mutedColor }}>
          {hasLower && <span style={{ marginRight: 8 }}>▸ {lower}{field.unit}</span>}
          {hasUpper && <span>◂ {upper}{field.unit}</span>}
        </div>
        <div style={{ fontSize: 11, color: mutedColor }}>
          {Math.round(pct)}%
          {over && <span style={{ color: isCalories ? "rgba(255,255,255,0.8)" : "var(--text-muted)", marginLeft: 4 }}>over</span>}
          {!isCalories && (hasLower || hasUpper) && !over && (
            inRange
              ? <span style={{ color: "#22C55E", marginLeft: 4 }}>in range</span>
              : <span style={{ color: "#999", marginLeft: 4 }}>out of range</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────

export default function MacroTracker() {
  const [tab, setTab] = useState("today");
  const [foods, setFoods] = useState(() => loadData(STORAGE_KEYS.foods, []));
  const [logs, setLogs] = useState(() => loadData(STORAGE_KEYS.logs, {}));
  const [fields, setFields] = useState(() => loadData(STORAGE_KEYS.fields, DEFAULT_FIELDS));
  const [customFields, setCustomFields] = useState(() => loadData(STORAGE_KEYS.customFields, []));
  const [goals, setGoals] = useState(() => loadData(STORAGE_KEYS.goals, DEFAULT_GOALS));
  const [showAddFood, setShowAddFood] = useState(false);
  const [showLogEntry, setShowLogEntry] = useState(false);
  const [editFood, setEditFood] = useState(null);
  const [showAddField, setShowAddField] = useState(false);
  const [showQuickWater, setShowQuickWater] = useState(false);
  const [showQuickFood, setShowQuickFood] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // { date, entry }
  const [categories, setCategories] = useState(() => loadData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES));
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addFoodCategory, setAddFoodCategory] = useState(null);
  const [weightLog, setWeightLog] = useState(() => loadData(STORAGE_KEYS.weightLog, {}));
  const [bounds, setBounds] = useState(() => loadData(STORAGE_KEYS.bounds, {}));
  const [viewDate, setViewDate] = useState(() => todayStr());
  const [symptomLog, setSymptomLog] = useState(() => loadData(STORAGE_KEYS.symptomLog, []));
  const [caloriePlan, setCaloriePlan] = useState(() => loadData(STORAGE_KEYS.caloriePlan, DEFAULT_CALORIE_PLAN));
  const [bowelLog, setBowelLog] = useState(() => loadData(STORAGE_KEYS.bowelLog, []));

  useEffect(() => saveData(STORAGE_KEYS.foods, foods), [foods]);
  useEffect(() => saveData(STORAGE_KEYS.logs, logs), [logs]);
  useEffect(() => saveData(STORAGE_KEYS.fields, fields), [fields]);
  useEffect(() => saveData(STORAGE_KEYS.customFields, customFields), [customFields]);
  useEffect(() => saveData(STORAGE_KEYS.goals, goals), [goals]);
  useEffect(() => saveData(STORAGE_KEYS.categories, categories), [categories]);
  useEffect(() => saveData(STORAGE_KEYS.weightLog, weightLog), [weightLog]);
  useEffect(() => saveData(STORAGE_KEYS.bounds, bounds), [bounds]);
  useEffect(() => saveData(STORAGE_KEYS.symptomLog, symptomLog), [symptomLog]);
  useEffect(() => saveData(STORAGE_KEYS.caloriePlan, caloriePlan), [caloriePlan]);
  useEffect(() => saveData(STORAGE_KEYS.bowelLog, bowelLog), [bowelLog]);

  const allFields = [...fields, ...customFields];
  const enabledFields = allFields.filter(f => f.enabled);
  const today = todayStr();
  const viewEntries = logs[viewDate] || [];
  const isToday = viewDate === today;

  const computeTotals = useCallback((entries) => {
    const totals = {};
    allFields.forEach(f => { totals[f.key] = 0; });
    (entries || []).forEach(entry => {
      if (entry.isQuickAdd) {
        allFields.forEach(f => {
          totals[f.key] = (totals[f.key] || 0) + (entry.values?.[f.key] || 0);
        });
      } else {
        const food = foods.find(f => f.id === entry.foodId);
        if (!food) return;
        allFields.forEach(f => {
          totals[f.key] = (totals[f.key] || 0) + (food.nutrition[f.key] || 0) * entry.servings;
        });
      }
    });
    return totals;
  }, [allFields, foods]);

  const viewTotals = computeTotals(viewEntries);

  // Compute calorie plan targets for the viewed date
  const smoothedForPlan = computeSmoothedWeights(weightLog);
  const tdeeForPlan = computeTDEE(smoothedForPlan, logs, allFields, foods, 28);
  const planTargets = tdeeForPlan ? computePlanTargets(caloriePlan, tdeeForPlan.tdee, viewDate) : null;
  const weeklyPlan = tdeeForPlan ? computeWeeklyPlan(caloriePlan, tdeeForPlan.tdee, viewDate, logs, foods, allFields) : null;

  // Merge plan targets into goals for the Today tab
  // Use the weekly-adjusted targets if available, otherwise raw plan targets
  const effectiveGoals = { ...goals };
  const activeDayTargets = weeklyPlan?.viewDayTargets || planTargets;
  if (activeDayTargets) {
    effectiveGoals.calories = activeDayTargets.calories;
    effectiveGoals.protein = activeDayTargets.protein;
    effectiveGoals.fat = activeDayTargets.fat;
    effectiveGoals.carbs = activeDayTargets.carbs;
    // Merge manual micro overrides (fiber, sodium, etc.)
    if (activeDayTargets.manualOverrides || (planTargets && planTargets.manualOverrides)) {
      const overrides = activeDayTargets.manualOverrides || planTargets.manualOverrides || {};
      for (const [key, val] of Object.entries(overrides)) {
        if (val !== undefined && val !== null && val !== "") {
          effectiveGoals[key] = parseFloat(val) || 0;
        }
      }
    }
  }

  function addLogEntry(foodId, servings, mealTag) {
    const newLogs = { ...logs };
    if (!newLogs[viewDate]) newLogs[viewDate] = [];
    newLogs[viewDate] = [...newLogs[viewDate], {
      id: generateId(), foodId, servings, mealTag: mealTag || "other",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setLogs(newLogs);

    // Decrement remaining servings for queued foods
    const food = foods.find(f => f.id === foodId);
    if (food && food.queued) {
      const remaining = (food.remainingServings || 0) - (parseFloat(servings) || 0);
      setFoods(foods.map(f => f.id === foodId ? {
        ...f,
        remainingServings: Math.max(0, remaining),
        depleted: remaining <= 0,
      } : f));
    }
  }

  function queueLogEntry(foodId, servings, mealTag) {
    const newLogs = { ...logs };
    if (!newLogs[viewDate]) newLogs[viewDate] = [];
    newLogs[viewDate] = [...newLogs[viewDate], {
      id: generateId(), foodId, servings, mealTag: mealTag || "other", planned: true, time: "",
    }];
    setLogs(newLogs);
  }

  function addQuickEntry(fieldKey, amount) {
    const newLogs = { ...logs };
    if (!newLogs[viewDate]) newLogs[viewDate] = [];
    newLogs[viewDate] = [...newLogs[viewDate], {
      id: generateId(),
      isQuickAdd: true,
      quickLabel: allFields.find(f => f.key === fieldKey)?.label || fieldKey,
      values: { [fieldKey]: amount },
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setLogs(newLogs);
  }

  function addQuickFoodEntry(label, values, mealTag) {
    const newLogs = { ...logs };
    if (!newLogs[viewDate]) newLogs[viewDate] = [];
    newLogs[viewDate] = [...newLogs[viewDate], {
      id: generateId(),
      isQuickAdd: true,
      quickLabel: label,
      values,
      mealTag: mealTag || "other",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setLogs(newLogs);
  }

  function queueQuickFoodEntry(label, values, mealTag) {
    const newLogs = { ...logs };
    if (!newLogs[viewDate]) newLogs[viewDate] = [];
    newLogs[viewDate] = [...newLogs[viewDate], {
      id: generateId(),
      isQuickAdd: true,
      quickLabel: label,
      values,
      mealTag: mealTag || "other",
      planned: true,
      time: "",
    }];
    setLogs(newLogs);
  }

  function updateLogEntry(date, updatedEntry) {
    const newLogs = { ...logs };
    newLogs[date] = newLogs[date].map(e => e.id === updatedEntry.id ? updatedEntry : e);
    setLogs(newLogs);
    setEditingEntry(null);
  }

  function addPlannedEntry(targetDate, foodId, servings, label, isQuickAdd, values) {
    const newLogs = { ...logs };
    if (!newLogs[targetDate]) newLogs[targetDate] = [];
    const entry = isQuickAdd
      ? { id: generateId(), isQuickAdd: true, quickLabel: label, values, planned: true, time: "" }
      : { id: generateId(), foodId, servings, planned: true, time: "" };
    newLogs[targetDate] = [...newLogs[targetDate], entry];
    setLogs(newLogs);
  }

  function checkOffPlannedEntry(date, entryId) {
    const newLogs = { ...logs };
    newLogs[date] = newLogs[date].map(e => e.id === entryId ? {
      ...e,
      planned: false,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    } : e);
    setLogs(newLogs);
  }

  function removeLogEntry(date, entryId) {
    const newLogs = { ...logs };
    newLogs[date] = (newLogs[date] || []).filter(e => e.id !== entryId);
    if (newLogs[date].length === 0) delete newLogs[date];
    setLogs(newLogs);
  }

  function saveFood(food) {
    if (editFood) {
      setFoods(foods.map(f => f.id === food.id ? food : f));
    } else {
      setFoods([...foods, food]);
    }
    setEditFood(null);
    setShowAddFood(false);
  }

  function deleteFood(id) {
    // Check if this food is referenced in any logs
    const isReferenced = Object.values(logs).some(dayEntries =>
      dayEntries.some(e => e.foodId === id)
    );
    if (isReferenced) {
      // Soft-delete: mark as depleted so logs still resolve
      setFoods(foods.map(f => f.id === id ? { ...f, depleted: true, hidden: true } : f));
    } else {
      // Hard-delete: no logs reference it
      setFoods(foods.filter(f => f.id !== id));
    }
  }

  function toggleField(key, isCustom) {
    if (isCustom) {
      setCustomFields(customFields.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
    } else {
      setFields(fields.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
    }
  }

  function addCustomField(label, unit) {
    const key = "custom_" + generateId();
    setCustomFields([...customFields, { key, label, unit, enabled: true }]);
    setShowAddField(false);
  }

  function removeCustomField(key) {
    setCustomFields(customFields.filter(f => f.key !== key));
  }

  function updateGoal(key, value) {
    setGoals({ ...goals, [key]: parseFloat(value) || 0 });
  }

  function updateBound(key, side, value) {
    const current = bounds[key] || {};
    setBounds({ ...bounds, [key]: { ...current, [side]: value === "" ? undefined : (parseFloat(value) || 0) } });
  }

  function shiftViewDate(days) {
    const d = new Date(viewDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    setViewDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div style={{
      "--accent": "#E8672E",
      "--accent-light": "#FFF0E8",
      "--bg": "#FAF8F5",
      "--card-bg": "#FFFFFF",
      "--text": "#1A1714",
      "--text-muted": "#8C857A",
      "--border": "#E8E4DE",
      "--input-bg": "#F5F3EF",
      "--font-heading": "'DM Serif Display', Georgia, serif",
      "--font-body": "'DM Sans', 'Helvetica Neue', sans-serif",
      "--success": "#4CAF50",
      minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)",
      maxWidth: 480, margin: "0 auto", paddingBottom: 80, position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "20px 20px 12px", background: "var(--bg)" }}>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--text)" }}>
          {TAB_LABELS[tab]}
        </div>
        {tab === "today" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <button onClick={() => shiftViewDate(-1)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontSize: 18, color: "var(--text-muted)", lineHeight: 1,
            }}>‹</button>
            <button onClick={() => setViewDate(today)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontSize: 13, color: isToday ? "var(--text-muted)" : "var(--accent)", fontFamily: "var(--font-body)", fontWeight: isToday ? 400 : 600,
            }}>
              {isToday ? formatDate(viewDate) : formatDate(viewDate)}
            </button>
            <button onClick={() => shiftViewDate(1)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontSize: 18, color: "var(--text-muted)", lineHeight: 1,
            }}>›</button>
            {!isToday && (
              <button onClick={() => setViewDate(today)} style={{
                background: "var(--accent)", border: "none", cursor: "pointer", padding: "3px 10px",
                fontSize: 11, color: "#fff", fontFamily: "var(--font-body)", fontWeight: 600, borderRadius: 12,
              }}>Today</button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px 16px" }}>

        {/* ═══ TODAY TAB ═══ */}
        {tab === "today" && (
          <>
            {/* Progress Bars */}
            {activeDayTargets && activeDayTargets.dayType && (
              <div style={{
                fontSize: 12, fontWeight: 600, color: "var(--accent)", marginBottom: 4,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ padding: "2px 8px", borderRadius: 8, background: "var(--accent-light)", fontSize: 11 }}>
                  {activeDayTargets.dayType} Day
                </span>
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  {activeDayTargets.calories} kcal target
                </span>
              </div>
            )}
            {/* Weekly Budget Summary */}
            {weeklyPlan && (
              <div style={{
                background: "var(--card-bg)", borderRadius: 12, padding: "10px 14px", marginBottom: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>Week budget:</span>{" "}
                  {Math.round(weeklyPlan.pastActualCals)} / {weeklyPlan.weeklyCalTarget} kcal
                </div>
                <div style={{ fontSize: 12, textAlign: "right" }}>
                  <span style={{ fontWeight: 700, color: weeklyPlan.remainingBudget >= 0 ? "var(--success)" : "#EF4444" }}>
                    {Math.round(weeklyPlan.remainingBudget)}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}> left · {weeklyPlan.remainingDays}d</span>
                </div>
              </div>
            )}
            {/* Adjustment notice */}
            {weeklyPlan?.viewDayTargets?.isAdjusted && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontStyle: "italic" }}>
                Targets adjusted from {weeklyPlan.viewDayTargets.rawCalories} → {weeklyPlan.viewDayTargets.calories} kcal to keep weekly average on track
              </div>
            )}
            {enabledFields.map(f => (
              <ProgressBar
                key={f.key}
                field={f}
                current={viewTotals[f.key] || 0}
                goal={effectiveGoals[f.key] || 0}
                isCalories={f.key === "calories"}
                lower={bounds[f.key]?.lower}
                upper={bounds[f.key]?.upper}
              />
            ))}

            {/* Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8, marginBottom: 16 }}>
              <Btn onClick={() => setShowLogEntry(true)}>+ Food</Btn>
              <Btn variant="secondary" onClick={() => setShowQuickWater(true)}>+ Water</Btn>
              <Btn variant="secondary" onClick={() => setShowQuickFood(true)}>+ Quick</Btn>
            </div>

            {/* Entries grouped by meal tag */}
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 8 }}>
              {isToday ? "Today's Entries" : "Entries"}
            </div>
            {viewEntries.length === 0 ? (
              <EmptyState icon="🍽" title="No entries yet" subtitle="Tap '+ Food' to get started" />
            ) : (
              <MealGroupedEntries
                entries={viewEntries}
                foods={foods}
                allFields={allFields}
                enabledFields={enabledFields}
                onRemove={(id) => removeLogEntry(viewDate, id)}
                onCheckOff={(id) => checkOffPlannedEntry(viewDate, id)}
                onEdit={(entry) => setEditingEntry({ date: viewDate, entry })}
              />
            )}
          </>
        )}

        {/* ═══ FOODS TAB ═══ */}
        {tab === "foods" && (
          <>
            <Btn onClick={() => { setEditFood(null); setAddFoodCategory(null); setShowAddFood(true); }} style={{ marginBottom: 16 }}>
              + Add Food Item
            </Btn>
            {foods.filter(f => !f.depleted && !f.hidden).length === 0 ? (
              <EmptyState icon="📦" title="No foods yet" subtitle="Add your first food item to get started" />
            ) : (
              categories.map(cat => {
                const catFoods = foods.filter(f => (f.category || "Other") === cat && !f.depleted && !f.hidden);
                if (catFoods.length === 0) return null;
                return (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    {/* Category Header */}
                    <div style={{
                      fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px",
                      color: "var(--accent)", marginBottom: 8, paddingBottom: 6,
                      borderBottom: "2px solid var(--accent)", display: "flex", alignItems: "center", gap: 8,
                    }}>
                      {cat}
                      <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "none", letterSpacing: 0 }}>
                        ({catFoods.length})
                      </span>
                    </div>
                    {/* Food Items */}
                    {catFoods.map(food => (
                      <div key={food.id} style={{
                        background: "var(--card-bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 6,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        borderLeft: food.queued ? "3px solid #F59E0B" : "3px solid var(--accent)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                              {food.name}
                              {food.queued && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
                                  background: "#FEF3C7", color: "#92400E",
                                }}>QUEUED</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                              Serving: {food.servingSize} {food.servingUnit}
                              {food.queued && (
                                <span style={{ marginLeft: 8, color: "#92400E", fontWeight: 600 }}>
                                  {Math.round((food.remainingServings || 0) * 100) / 100} remaining
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "flex", flexWrap: "wrap", gap: "6px 12px" }}>
                              {enabledFields.map(f => (
                                food.nutrition[f.key] ? <span key={f.key}>{f.label}: {food.nutrition[f.key]}{f.unit}</span> : null
                              ))}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            <button onClick={() => { setEditFood(food); setShowAddFood(true); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>Edit</button>
                            <button onClick={() => deleteFood(food.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#cc3333", fontSize: 13, fontWeight: 600 }}>Del</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
            {/* Show uncategorized if any foods have categories not in the list */}
            {(() => {
              const uncategorized = foods.filter(f => f.category && !categories.includes(f.category) && !f.depleted && !f.hidden);
              if (uncategorized.length === 0) return null;
              return (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)", marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid var(--border)" }}>
                    Uncategorized
                  </div>
                  {uncategorized.map(food => (
                    <div key={food.id} style={{
                      background: "var(--card-bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 6,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{food.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Serving: {food.servingSize} {food.servingUnit}</div>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => { setEditFood(food); setShowAddFood(true); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>Edit</button>
                          <button onClick={() => deleteFood(food.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#cc3333", fontSize: 13, fontWeight: 600 }}>Del</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}

        {/* ═══ LOG TAB ═══ */}
        {/* ═══ WEIGHT TAB ═══ */}
        {tab === "weight" && <WeightPanel weightLog={weightLog} setWeightLog={setWeightLog} logs={logs} foods={foods} allFields={allFields} />}

        {/* ═══ SYMPTOMS TAB ═══ */}
        {tab === "symptoms" && <SymptomsPanel symptomLog={symptomLog} setSymptomLog={setSymptomLog} />}

        {/* ═══ BOWEL TAB ═══ */}
        {tab === "bowel" && <BowelPanel bowelLog={bowelLog} setBowelLog={setBowelLog} />}

        {/* ═══ STATS TAB ═══ */}
        {tab === "stats" && <StatsPanel logs={logs} foods={foods} enabledFields={enabledFields} computeTotals={computeTotals} goals={goals} weightLog={weightLog} allFields={allFields} caloriePlan={caloriePlan} weeklyPlan={weeklyPlan} tdeeForPlan={tdeeForPlan} />}

        {/* ═══ SETTINGS TAB ═══ */}
        {tab === "settings" && (
          <>
            {/* Calorie Plan */}
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>
              Calorie Plan
            </div>
            <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: "16px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {!tdeeForPlan && (() => {
                const prog = computeTDEEProgress(weightLog, logs);
                return (
                  <div style={{ marginBottom: 12, padding: "10px 12px", background: "var(--input-bg)", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                      TDEE not yet available — configure your plan now and targets will activate automatically.
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                      <span style={{ color: prog.weightNeeded === 0 ? "var(--success)" : "var(--text)" }}>
                        Weight: <span style={{ fontWeight: 700 }}>{prog.weightDays}/14</span>
                        {prog.weightNeeded > 0 && <span style={{ color: "var(--accent)" }}> ({prog.weightNeeded} more)</span>}
                      </span>
                      <span style={{ color: prog.foodNeeded === 0 ? "var(--success)" : "var(--text)" }}>
                        Food: <span style={{ fontWeight: 700 }}>{prog.foodDays}/7</span>
                        {prog.foodNeeded > 0 && <span style={{ color: "var(--accent)" }}> ({prog.foodNeeded} more)</span>}
                      </span>
                    </div>
                  </div>
                );
              })()}
              {tdeeForPlan && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                  Estimated TDEE: <span style={{ fontWeight: 700, color: "var(--text)" }}>{tdeeForPlan.tdee} kcal/day</span>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--text-muted)", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Weekly Rate (lbs/week)
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number" inputMode="decimal" step="0.1" min="0"
                    value={Math.abs(parseFloat(caloriePlan.weeklyRate) || 0) || ""}
                    onChange={e => {
                      const abs = parseFloat(e.target.value) || 0;
                      const sign = (parseFloat(caloriePlan.weeklyRate) || 0) >= 0 ? 1 : -1;
                      setCaloriePlan({ ...caloriePlan, weeklyRate: sign * abs });
                    }}
                    placeholder="0.5"
                    style={{
                      flex: 1, padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 10,
                      fontSize: 15, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)",
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                  {/* Surplus / Deficit toggle */}
                  <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--border)", flexShrink: 0 }}>
                    {[["Deficit", -1], ["Surplus", 1]].map(([label, sign]) => {
                      const isActive = sign === -1
                        ? (parseFloat(caloriePlan.weeklyRate) || 0) < 0
                        : (parseFloat(caloriePlan.weeklyRate) || 0) >= 0;
                      return (
                        <button key={label} onClick={() => {
                          const abs = Math.abs(parseFloat(caloriePlan.weeklyRate) || 0);
                          setCaloriePlan({ ...caloriePlan, weeklyRate: sign * abs });
                        }} style={{
                          padding: "10px 12px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                          fontFamily: "var(--font-body)", transition: "all 0.15s",
                          background: isActive ? "var(--accent)" : "var(--input-bg)",
                          color: isActive ? "#fff" : "var(--text-muted)",
                        }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {(parseFloat(caloriePlan.weeklyRate) || 0) !== 0 && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {Math.round(Math.abs(parseFloat(caloriePlan.weeklyRate) || 0) * 500)} kcal/day {(parseFloat(caloriePlan.weeklyRate) || 0) < 0 ? "deficit" : "surplus"}
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FieldInput label="Protein (g/day)" value={caloriePlan.protein !== undefined ? String(caloriePlan.protein) : ""} onChange={v => setCaloriePlan({ ...caloriePlan, protein: parseFloat(v) || 0 })} type="number" step="1" placeholder="150" />
                <FieldInput label="Fat (g/day)" value={caloriePlan.fat !== undefined ? String(caloriePlan.fat) : ""} onChange={v => setCaloriePlan({ ...caloriePlan, fat: parseFloat(v) || 0 })} type="number" step="1" placeholder="65" />
              </div>
              {tdeeForPlan && (() => {
                const targets = computePlanTargets(caloriePlan, tdeeForPlan.tdee, todayStr());
                if (!targets) return null;
                return (
                  <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 14px", marginTop: 4, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: "var(--text-muted)", marginBottom: 6 }}>
                      {caloriePlan.cyclingEnabled ? "Base" : "Daily"} Targets
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                      <span><span style={{ fontWeight: 700 }}>{targets.calories}</span> kcal</span>
                      <span><span style={{ fontWeight: 700 }}>{targets.protein}</span>g P</span>
                      <span><span style={{ fontWeight: 700 }}>{targets.fat}</span>g F</span>
                      <span><span style={{ fontWeight: 700 }}>{targets.carbs}</span>g C</span>
                    </div>
                  </div>
                );
              })()}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--border)", marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Calorie Cycling</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Different targets per day type</div>
                </div>
                <Toggle checked={caloriePlan.cyclingEnabled || false} onChange={() => setCaloriePlan({ ...caloriePlan, cyclingEnabled: !caloriePlan.cyclingEnabled })} />
              </div>
              {caloriePlan.cyclingEnabled && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: "var(--text-muted)", marginTop: 8, marginBottom: 6 }}>Day Types</div>
                  {(caloriePlan.dayTypes || []).map((dt, i) => {
                    const isManual = dt.mode === "manual";
                    const updateDT = (updates) => { const u = [...caloriePlan.dayTypes]; u[i] = { ...u[i], ...updates }; setCaloriePlan({ ...caloriePlan, dayTypes: u }); };
                    return (
                    <div key={i} style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <input value={dt.name} onChange={e => updateDT({ name: e.target.value })} style={{ border: "none", background: "transparent", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", color: "var(--text)", outline: "none", width: 120 }} />
                        <button onClick={() => setCaloriePlan({ ...caloriePlan, dayTypes: caloriePlan.dayTypes.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: "#cc3333", cursor: "pointer", fontSize: 14 }}>×</button>
                      </div>
                      {/* Mode toggle */}
                      <div style={{ display: "flex", gap: 0, marginBottom: 8, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <button onClick={() => updateDT({ mode: undefined })} style={{
                          flex: 1, padding: "4px 0", fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none",
                          background: !isManual ? "var(--accent)" : "#fff", color: !isManual ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-body)",
                        }}>Relative</button>
                        <button onClick={() => updateDT({ mode: "manual" })} style={{
                          flex: 1, padding: "4px 0", fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none", borderLeft: "1px solid var(--border)",
                          background: isManual ? "var(--accent)" : "#fff", color: isManual ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-body)",
                        }}>Manual</button>
                      </div>
                      {!isManual ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                          {[["Cal Offset", "calOffset", "0"], ["P mult", "proteinMult", "1"], ["F mult", "fatMult", "1"]].map(([lbl, key, def]) => (
                            <div key={key}>
                              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{lbl}</div>
                              <input type="number" inputMode="decimal" step={key === "calOffset" ? "50" : "0.1"} value={dt[key] !== undefined ? dt[key] : ""} onChange={e => updateDT({ [key]: parseFloat(e.target.value) || (key === "calOffset" ? 0 : 1) })} style={{ width: "100%", padding: "4px 6px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: 12, background: "#fff", color: "var(--text)", fontFamily: "var(--font-body)", outline: "none", textAlign: "center" }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {/* Manual macro targets */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                            {[["Calories", "manualCalories", "kcal"], ["Protein", "manualProtein", "g"], ["Fat", "manualFat", "g"], ["Carbs", "manualCarbs", "g"]].map(([lbl, key, unit]) => (
                              <div key={key}>
                                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{lbl} ({unit})</div>
                                <input type="number" inputMode="decimal" value={dt[key] !== undefined ? dt[key] : ""} placeholder="—" onChange={e => updateDT({ [key]: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "4px 6px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: 12, background: "#fff", color: "var(--text)", fontFamily: "var(--font-body)", outline: "none", textAlign: "center" }} />
                              </div>
                            ))}
                          </div>
                          {/* Manual micro targets */}
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, marginTop: 4 }}>Micro overrides (optional)</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                            {enabledFields.filter(f => !["calories","protein","fat","carbs"].includes(f.key)).map(f => (
                              <div key={f.key}>
                                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 1 }}>{f.label}</div>
                                <input type="number" inputMode="decimal" value={(dt.manualOverrides || {})[f.key] !== undefined ? (dt.manualOverrides || {})[f.key] : ""} placeholder="—" onChange={e => {
                                  const overrides = { ...(dt.manualOverrides || {}) };
                                  if (e.target.value === "") { delete overrides[f.key]; } else { overrides[f.key] = parseFloat(e.target.value) || 0; }
                                  updateDT({ manualOverrides: overrides });
                                }} style={{ width: "100%", padding: "3px 4px", border: "1.5px solid var(--border)", borderRadius: 5, fontSize: 11, background: "#fff", color: "var(--text)", fontFamily: "var(--font-body)", outline: "none", textAlign: "center" }} />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    );
                  })}
                  <button onClick={() => setCaloriePlan({ ...caloriePlan, dayTypes: [...(caloriePlan.dayTypes || []), { name: "New", calOffset: 0, proteinMult: 1, fatMult: 1 }] })} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "4px 0", fontFamily: "var(--font-body)", marginBottom: 12 }}>+ Add Day Type</button>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: "var(--text-muted)", marginBottom: 6 }}>Weekly Schedule</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                    {["MO","TU","WE","TH","FR","SA","SU"].map(dow => {
                      const currentType = caloriePlan.weekSchedule?.[dow] || (caloriePlan.dayTypes?.[0]?.name || "Rest");
                      return (
                        <div key={dow} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>{dow}</div>
                          <select value={currentType} onChange={e => setCaloriePlan({ ...caloriePlan, weekSchedule: { ...(caloriePlan.weekSchedule || {}), [dow]: e.target.value } })} style={{ width: "100%", padding: "4px 2px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: 9, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)", outline: "none" }}>
                            {(caloriePlan.dayTypes || []).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Categories */}
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>
              Food Categories
            </div>
            <div style={{ background: "var(--card-bg)", borderRadius: 14, overflow: "hidden", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {categories.map((cat, i) => (
                <div key={cat} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px",
                  borderBottom: i < categories.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{cat}</span>
                  <button onClick={() => {
                    if (confirm(`Delete "${cat}" category? Foods in this category will move to "Other".`)) {
                      setFoods(foods.map(f => f.category === cat ? { ...f, category: "Other" } : f));
                      setCategories(categories.filter(c => c !== cat));
                    }
                  }} style={{ background: "none", border: "none", color: "#cc3333", cursor: "pointer", fontSize: 12, padding: "2px 6px" }}>✕</button>
                </div>
              ))}
            </div>
            <Btn variant="secondary" onClick={() => setShowAddCategory(true)} style={{ marginBottom: 24 }}>
              + Add Category
            </Btn>

            {/* Daily Goals */}
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>
              Daily Goals & Bounds
            </div>
            <div style={{ background: "var(--card-bg)", borderRadius: 14, overflow: "hidden", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {enabledFields.map((f, i) => {
                const b = bounds[f.key] || {};
                return (
                  <div key={f.key} style={{
                    padding: "12px 16px",
                    borderBottom: i < enabledFields.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      {f.label} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>({f.unit})</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                      {/* Lower Bound */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 3 }}>Lower</div>
                        <input
                          type="number"
                          value={b.lower !== undefined ? b.lower : ""}
                          onChange={e => updateBound(f.key, "lower", e.target.value)}
                          placeholder="—"
                          step="any"
                          style={{
                            width: "100%", padding: "6px 8px", border: "1.5px solid var(--border)", borderRadius: 8,
                            fontSize: 13, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)",
                            outline: "none", textAlign: "center",
                          }}
                          onFocus={e => e.target.style.borderColor = "#1D4ED8"}
                          onBlur={e => e.target.style.borderColor = "var(--border)"}
                        />
                      </div>
                      {/* Goal */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 3 }}>Goal</div>
                        <input
                          type="number"
                          value={goals[f.key] || ""}
                          onChange={e => updateGoal(f.key, e.target.value)}
                          placeholder="0"
                          step="any"
                          style={{
                            width: "100%", padding: "6px 8px", border: "1.5px solid var(--border)", borderRadius: 8,
                            fontSize: 13, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)",
                            outline: "none", textAlign: "center",
                          }}
                          onFocus={e => e.target.style.borderColor = "var(--accent)"}
                          onBlur={e => e.target.style.borderColor = "var(--border)"}
                        />
                      </div>
                      {/* Upper Bound */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#B45309", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 3 }}>Upper</div>
                        <input
                          type="number"
                          value={b.upper !== undefined ? b.upper : ""}
                          onChange={e => updateBound(f.key, "upper", e.target.value)}
                          placeholder="—"
                          step="any"
                          style={{
                            width: "100%", padding: "6px 8px", border: "1.5px solid var(--border)", borderRadius: 8,
                            fontSize: 13, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)",
                            outline: "none", textAlign: "center",
                          }}
                          onFocus={e => e.target.style.borderColor = "#B45309"}
                          onBlur={e => e.target.style.borderColor = "var(--border)"}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nutrition Fields */}
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>
              Nutrition Fields
            </div>
            <div style={{ background: "var(--card-bg)", borderRadius: 14, overflow: "hidden", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {fields.map((f, i) => (
                <div key={f.key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px",
                  borderBottom: i < fields.length - 1 || customFields.length > 0 ? "1px solid var(--border)" : "none",
                }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{f.label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>{f.unit}</span>
                  </div>
                  <Toggle checked={f.enabled} onChange={() => toggleField(f.key, false)} />
                </div>
              ))}
              {customFields.map((f, i) => (
                <div key={f.key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px",
                  borderBottom: i < customFields.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{f.label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.unit}</span>
                    <button onClick={() => removeCustomField(f.key)} style={{ background: "none", border: "none", color: "#cc3333", cursor: "pointer", fontSize: 11, padding: "2px 6px" }}>✕</button>
                  </div>
                  <Toggle checked={f.enabled} onChange={() => toggleField(f.key, true)} />
                </div>
              ))}
            </div>
            <Btn variant="secondary" onClick={() => setShowAddField(true)} style={{ marginBottom: 24 }}>
              + Add Custom Field
            </Btn>

            {/* Backup & Restore */}
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>
              Backup & Restore
            </div>
            <Btn variant="secondary" onClick={() => {
              const backup = {
                version: 2,
                exportedAt: new Date().toISOString(),
                foods, logs, fields, customFields, goals, categories, weightLog, bounds, symptomLog, caloriePlan, bowelLog,
              };
              const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `macro-tracker-backup-${todayStr()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }} style={{ marginBottom: 8 }}>
              Export Backup
            </Btn>
            <Btn variant="secondary" onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const data = JSON.parse(ev.target.result);
                    if (!data.foods || !data.logs || !data.fields) {
                      alert("Invalid backup file.");
                      return;
                    }
                    if (confirm("Restore from backup? This will replace all current data.")) {
                      setFoods(data.foods);
                      setLogs(data.logs);
                      setFields(data.fields);
                      setCustomFields(data.customFields || []);
                      if (data.goals) setGoals(data.goals);
                      if (data.categories) setCategories(data.categories);
                      if (data.weightLog) setWeightLog(data.weightLog);
                      if (data.bounds) setBounds(data.bounds);
                      if (data.symptomLog) setSymptomLog(data.symptomLog);
                      if (data.caloriePlan) setCaloriePlan(data.caloriePlan);
                      if (data.bowelLog) setBowelLog(data.bowelLog);
                      alert("Backup restored successfully!");
                    }
                  } catch {
                    alert("Could not read backup file.");
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }} style={{ marginBottom: 24 }}>
              Import Backup
            </Btn>

            {/* Danger Zone */}
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>
              Danger Zone
            </div>
            <Btn variant="danger" onClick={() => {
              if (confirm("Clear ALL data? This cannot be undone.")) {
                setFoods([]); setLogs({}); setFields(DEFAULT_FIELDS); setCustomFields([]); setGoals(DEFAULT_GOALS); setCategories(DEFAULT_CATEGORIES); setWeightLog({}); setBounds({}); setSymptomLog([]); setCaloriePlan(DEFAULT_CALORIE_PLAN); setBowelLog([]);
              }
            }}>
              Reset All Data
            </Btn>
          </>
        )}
      </div>

      {/* ─── Bottom Tab Bar ──────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480,
        background: "var(--card-bg)", borderTop: "1px solid var(--border)", display: "flex",
        padding: "6px 0 env(safe-area-inset-bottom, 8px)", zIndex: 50,
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer", padding: "6px 0 2px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            color: tab === t ? "var(--accent)" : "var(--text-muted)", transition: "color 0.2s",
          }}>
            <Icon path={TAB_ICONS[t]} size={22} color={tab === t ? "var(--accent)" : "var(--text-muted)"} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{TAB_LABELS[t]}</span>
          </button>
        ))}
      </div>

      {/* ─── Modals ──────────────────────────────────────────── */}
      <AddFoodModal open={showAddFood} onClose={() => { setShowAddFood(false); setEditFood(null); setAddFoodCategory(null); }} onSave={saveFood} editFood={editFood} allFields={allFields} enabledFields={enabledFields} categories={categories} defaultCategory={addFoodCategory} foods={foods} />
      <LogEntryModal open={showLogEntry} onClose={() => setShowLogEntry(false)} foods={foods} enabledFields={enabledFields} onAdd={addLogEntry} onQueue={queueLogEntry} categories={categories} />
      <AddFieldModal open={showAddField} onClose={() => setShowAddField(false)} onAdd={addCustomField} />
      <QuickWaterModal open={showQuickWater} onClose={() => setShowQuickWater(false)} onAdd={(amt) => { addQuickEntry("water", amt); setShowQuickWater(false); }} waterUnit={fields.find(f => f.key === "water")?.unit || "oz"} />
      <QuickFoodModal open={showQuickFood} onClose={() => setShowQuickFood(false)} enabledFields={enabledFields} onAdd={(label, values, mealTag) => { addQuickFoodEntry(label, values, mealTag); setShowQuickFood(false); }} onQueue={(label, values, mealTag) => { queueQuickFoodEntry(label, values, mealTag); setShowQuickFood(false); }} />
      {editingEntry && <EditEntryModal entry={editingEntry.entry} date={editingEntry.date} foods={foods} enabledFields={enabledFields} allFields={allFields} onSave={(updated) => updateLogEntry(editingEntry.date, updated)} onClose={() => setEditingEntry(null)} />}
      <AddCategoryModal open={showAddCategory} onClose={() => setShowAddCategory(false)} onAdd={(name) => { setCategories([...categories, name]); setShowAddCategory(false); }} existingCategories={categories} />
    </div>
  );
}

// ─── Toggle Component ────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 26, borderRadius: 13, cursor: "pointer", position: "relative", transition: "background 0.2s",
      background: checked ? "var(--accent)" : "var(--border)",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 3,
        left: checked ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }} />
    </div>
  );
}

// ─── Quick Water Modal ───────────────────────────────────────────

function QuickWaterModal({ open, onClose, onAdd, waterUnit }) {
  const [amount, setAmount] = useState("");
  const presets = [8, 12, 16, 24, 32];

  useEffect(() => { if (open) setAmount(""); }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Log Water">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {presets.map(oz => (
          <button key={oz} onClick={() => onAdd(oz)} style={{
            padding: "14px 8px", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--input-bg)",
            cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-body)", color: "var(--text)",
            transition: "all 0.15s",
          }}>
            {oz} {waterUnit}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 8 }}>
        Or enter custom amount
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <input
            type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" step="any"
            style={{
              width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 10,
              fontSize: 15, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)", outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>
        <Btn onClick={() => { if (parseFloat(amount) > 0) onAdd(parseFloat(amount)); }} disabled={!amount || parseFloat(amount) <= 0} style={{ width: "auto", padding: "10px 20px" }}>
          Add
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Quick Food Modal (one-off entry) ────────────────────────────

function QuickFoodModal({ open, onClose, enabledFields, onAdd, onQueue }) {
  const [label, setLabel] = useState("");
  const [values, setValues] = useState({});
  const [mealTag, setMealTag] = useState("other");

  useEffect(() => { if (open) { setLabel(""); setValues({}); setMealTag("other"); } }, [open]);

  function handleSubmit(planned) {
    if (!label.trim()) return;
    const parsed = {};
    for (const [k, v] of Object.entries(values)) {
      parsed[k] = typeof v === 'string' ? (parseFloat(v) || 0) : (v || 0);
    }
    if (planned) onQueue(label.trim(), parsed, mealTag);
    else onAdd(label.trim(), parsed, mealTag);
  }

  return (
    <Modal open={open} onClose={onClose} title="Quick Add">
      <FieldInput label="Label" value={label} onChange={setLabel} placeholder="e.g. Lunch at restaurant" />
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", margin: "4px 0 8px" }}>
        Nutrition
      </div>
      {enabledFields.map(f => (
        <FieldInput key={f.key} label={f.label} unit={f.unit} type="number" step="any" placeholder="0"
          value={values[f.key] !== undefined ? values[f.key] : ""}
          onChange={v => setValues({ ...values, [f.key]: v })}
        />
      ))}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Meal</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MEAL_TAGS.map(t => (
            <button key={t.key} onClick={() => setMealTag(t.key)} style={{
              padding: "5px 10px", borderRadius: 16, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)",
              background: mealTag === t.key ? "var(--accent)" : "var(--input-bg)",
              color: mealTag === t.key ? "#fff" : "var(--text-muted)",
            }}>{t.emoji} {t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 8, marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose} style={{ width: "auto", padding: "11px 16px" }}>✕</Btn>
        <Btn variant="secondary" onClick={() => handleSubmit(true)} disabled={!label.trim()}>Queue</Btn>
        <Btn onClick={() => handleSubmit(false)} disabled={!label.trim()}>Add</Btn>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 6 }}>
        Queue = planned, shows but doesn't log until checked off
      </div>
    </Modal>
  );
}
// ─── Add/Edit Food Modal ─────────────────────────────────────────

function AddFoodModal({ open, onClose, onSave, editFood, allFields, enabledFields, categories, defaultCategory, foods }) {
  const [name, setName] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [servingUnit, setServingUnit] = useState("");
  const [nutrition, setNutrition] = useState({});
  const [category, setCategory] = useState("Other");
  const [mode, setMode] = useState("manual"); // "manual" or "recipe"
  const [ingredients, setIngredients] = useState([]); // [{ foodId, servings }]
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [totalServings, setTotalServings] = useState("");

  useEffect(() => {
    if (editFood) {
      setName(editFood.name);
      setServingSize(String(editFood.servingSize));
      setServingUnit(editFood.servingUnit);
      setNutrition(editFood.nutrition || {});
      setCategory(editFood.category || "Other");
      setIngredients(editFood.ingredients || []);
      setMode(editFood.ingredients && editFood.ingredients.length > 0 ? "recipe" : "manual");
      setIsQueued(editFood.queued || false);
      setTotalServings(editFood.queued ? String(editFood.remainingServings || "") : "");
    } else {
      setName(""); setServingSize(""); setServingUnit(""); setNutrition({});
      setCategory(defaultCategory || "Other");
      setIngredients([]);
      setMode("manual");
      setIsQueued(false);
      setTotalServings("");
    }
    setIngredientSearch("");
    setShowIngredientPicker(false);
  }, [editFood, open, defaultCategory]);

  // Compute combined nutrition from ingredients
  const recipeTotals = {};
  enabledFields.forEach(f => { recipeTotals[f.key] = 0; });
  ingredients.forEach(ing => {
    const food = foods.find(f => f.id === ing.foodId);
    if (!food) return;
    enabledFields.forEach(f => {
      recipeTotals[f.key] = (recipeTotals[f.key] || 0) + (food.nutrition[f.key] || 0) * (ing.servings || 1);
    });
  });

  function addIngredient(foodId) {
    setIngredients([...ingredients, { foodId, servings: 1 }]);
    setIngredientSearch("");
    setShowIngredientPicker(false);
  }

  function updateIngredientServings(index, val) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], servings: val };
    setIngredients(updated);
  }

  function removeIngredient(index) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!name.trim()) return;
    const finalNutrition = mode === "recipe" ? { ...recipeTotals } : (() => {
      const parsed = {};
      for (const [k, v] of Object.entries(nutrition)) {
        parsed[k] = typeof v === 'string' ? (parseFloat(v) || 0) : (v || 0);
      }
      return parsed;
    })();

    onSave({
      id: editFood ? editFood.id : generateId(),
      name: name.trim(),
      servingSize: parseFloat(servingSize) || 1,
      servingUnit: servingUnit.trim() || "serving",
      nutrition: finalNutrition,
      category,
      ...(mode === "recipe" ? { ingredients } : {}),
      ...(isQueued ? { queued: true, remainingServings: parseFloat(totalServings) || 1, depleted: false } : {}),
    });
  }

  const filteredFoods = foods.filter(f =>
    f.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
    !ingredients.some(ing => ing.foodId === f.id)
  );

  return (
    <Modal open={open} onClose={onClose} title={editFood ? "Edit Food" : "Add Food"}>
      <FieldInput label="Food Name" value={name} onChange={setName} placeholder="e.g. Omelette" />

      {/* Category Picker */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--text-muted)", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Category
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: category === cat ? "2px solid var(--accent)" : "1.5px solid var(--border)",
              background: category === cat ? "var(--accent)" : "var(--input-bg)",
              color: category === cat ? "#fff" : "var(--text)",
              fontFamily: "var(--font-body)", transition: "all 0.15s",
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--border)" }}>
        <button onClick={() => setMode("manual")} style={{
          flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
          background: mode === "manual" ? "var(--accent)" : "var(--input-bg)",
          color: mode === "manual" ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-body)",
        }}>Manual Entry</button>
        <button onClick={() => setMode("recipe")} style={{
          flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
          borderLeft: "1.5px solid var(--border)",
          background: mode === "recipe" ? "var(--accent)" : "var(--input-bg)",
          color: mode === "recipe" ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-body)",
        }}>Build from Recipe</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <FieldInput label="Serving Size" value={servingSize} onChange={setServingSize} type="number" placeholder="1" step="any" />
        <FieldInput label="Serving Unit" value={servingUnit} onChange={setServingUnit} placeholder="serving" />
      </div>

      {mode === "manual" ? (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", margin: "8px 0 8px" }}>
            Nutrition per Serving
          </div>
          {enabledFields.map(f => (
            <FieldInput key={f.key} label={f.label} unit={f.unit} type="number" step="any" placeholder="0"
              value={nutrition[f.key] !== undefined ? nutrition[f.key] : ""}
              onChange={v => setNutrition({ ...nutrition, [f.key]: v })}
            />
          ))}
        </>
      ) : (
        <>
          {/* Recipe Builder */}
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", margin: "8px 0 8px" }}>
            Ingredients
          </div>

          {/* Ingredient list */}
          {ingredients.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {ingredients.map((ing, i) => {
                const food = foods.find(f => f.id === ing.foodId);
                if (!food) return null;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 4,
                    background: "var(--input-bg)", borderRadius: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{food.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{food.servingSize} {food.servingUnit} per serving</div>
                    </div>
                    <input
                      type="number" inputMode="decimal"
                      value={ing.servings}
                      onChange={e => updateIngredientServings(i, e.target.value)}
                      step="any"
                      style={{
                        width: 52, padding: "5px 6px", border: "1.5px solid var(--border)", borderRadius: 8,
                        fontSize: 13, background: "#fff", color: "var(--text)", fontFamily: "var(--font-body)",
                        outline: "none", textAlign: "center", fontWeight: 600,
                      }}
                      onFocus={e => e.target.style.borderColor = "var(--accent)"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                    <button onClick={() => removeIngredient(i)} style={{
                      background: "none", border: "none", color: "#cc3333", cursor: "pointer", fontSize: 16, padding: 4, lineHeight: 1,
                    }}>×</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add ingredient */}
          {showIngredientPicker ? (
            <div style={{ marginBottom: 12 }}>
              <input
                type="text" value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)}
                placeholder="Search foods..." autoFocus
                style={{
                  width: "100%", padding: "10px 12px", border: "1.5px solid var(--accent)", borderRadius: 10,
                  fontSize: 14, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)",
                  outline: "none", boxSizing: "border-box", marginBottom: 4,
                }}
              />
              <div style={{ maxHeight: 160, overflowY: "auto" }}>
                {filteredFoods.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 12, color: "var(--text-muted)", fontSize: 12 }}>
                    {foods.length === 0 ? "No foods in your library" : "No matches"}
                  </div>
                ) : (
                  filteredFoods.map(food => (
                    <div key={food.id} onClick={() => addIngredient(food.id)} style={{
                      padding: "8px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
                      background: "var(--card-bg)", fontSize: 13, fontWeight: 500,
                    }}>
                      {food.name} <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({food.servingSize} {food.servingUnit})</span>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => { setShowIngredientPicker(false); setIngredientSearch(""); }} style={{
                background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: "4px 0", fontFamily: "var(--font-body)",
              }}>Cancel</button>
            </div>
          ) : (
            <Btn variant="secondary" onClick={() => setShowIngredientPicker(true)} style={{ marginBottom: 12 }}>
              + Add Ingredient
            </Btn>
          )}

          {/* Computed totals */}
          {ingredients.length > 0 && (
            <div style={{
              background: "var(--input-bg)", borderRadius: 10, padding: "10px 14px", marginBottom: 8,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: "var(--text-muted)", marginBottom: 6 }}>
                Combined Nutrition
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
                {enabledFields.map(f => (
                  recipeTotals[f.key] ? (
                    <span key={f.key} style={{ fontSize: 12 }}>
                      <span style={{ color: "var(--text-muted)" }}>{f.label}:</span>{" "}
                      <span style={{ fontWeight: 600 }}>{Math.round(recipeTotals[f.key] * 10) / 10}{f.unit}</span>
                    </span>
                  ) : null
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Queued Toggle */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 0", borderTop: "1px solid var(--border)", marginTop: 8,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Queued Item</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Limited quantity — removed when used up</div>
        </div>
        <Toggle checked={isQueued} onChange={() => setIsQueued(!isQueued)} />
      </div>
      {isQueued && (
        <FieldInput label="Total Servings Available" value={totalServings} onChange={setTotalServings} type="number" placeholder="e.g. 4" step="any" />
      )}

      <Btn onClick={handleSave} disabled={!name.trim() || (mode === "recipe" && ingredients.length === 0) || (isQueued && (!totalServings || parseFloat(totalServings) <= 0))} style={{ marginTop: 8 }}>
        {editFood ? "Save Changes" : "Add Food"}
      </Btn>
    </Modal>
  );
}

// ─── Log Entry Modal ─────────────────────────────────────────────

function LogEntryModal({ open, onClose, foods, enabledFields, onAdd, onQueue, categories }) {
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [servings, setServings] = useState("1");
  const [mealTag, setMealTag] = useState("other");

  useEffect(() => { if (open) { setSearch(""); setSelectedFood(null); setServings("1"); setMealTag("other"); } }, [open]);

  // Filter out depleted/hidden foods
  const availableFoods = foods.filter(f => !f.depleted && !f.hidden);
  const filtered = availableFoods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const isSearching = search.trim().length > 0;

  function handleAdd() {
    if (!selectedFood) return;
    const s = parseFloat(servings) || 1;
    onAdd(selectedFood.id, s, mealTag);
    onClose();
  }

  function handleQueue() {
    if (!selectedFood) return;
    const s = parseFloat(servings) || 1;
    onQueue(selectedFood.id, s, mealTag);
    onClose();
  }

  const maxServings = selectedFood?.queued ? (selectedFood.remainingServings || 0) : null;
  const servingsExceedsMax = maxServings !== null && (parseFloat(servings) || 0) > maxServings;

  const FoodRow = ({ food }) => (
    <div onClick={() => { setSelectedFood(food); setServings("1"); }} style={{
      padding: "12px 14px", borderRadius: 10, cursor: "pointer", marginBottom: 4,
      background: "var(--input-bg)", transition: "background 0.15s",
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
        {food.name}
        {food.queued && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6, background: "#FEF3C7", color: "#92400E" }}>
            {Math.round((food.remainingServings || 0) * 100) / 100} left
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
        {food.servingSize} {food.servingUnit}
        {enabledFields.length > 0 && " · "}
        {enabledFields.slice(0, 3).map(f => `${food.nutrition[f.key] || 0}${f.unit}`).join(" / ")}
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Log Food">
      {!selectedFood ? (
        <>
          <FieldInput label="Search Foods" value={search} onChange={setSearch} placeholder="Type to search..." />
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
                {availableFoods.length === 0 ? "Add foods in the Foods tab first" : "No matches found"}
              </div>
            ) : isSearching ? (
              filtered.map(food => <FoodRow key={food.id} food={food} />)
            ) : (
              categories.map(cat => {
                const catFoods = filtered.filter(f => (f.category || "Other") === cat);
                if (catFoods.length === 0) return null;
                return (
                  <div key={cat}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--accent)", padding: "8px 4px 4px", marginTop: 4 }}>
                      {cat}
                    </div>
                    {catFoods.map(food => <FoodRow key={food.id} food={food} />)}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ background: "var(--input-bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              {selectedFood.name}
              {selectedFood.queued && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: "#FEF3C7", color: "#92400E" }}>
                  {Math.round((selectedFood.remainingServings || 0) * 100) / 100} servings left
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Per {selectedFood.servingSize} {selectedFood.servingUnit}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", marginTop: 6 }}>
              {enabledFields.map(f => (
                <span key={f.key} style={{ fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{f.label}:</span>{" "}
                  <span style={{ fontWeight: 600 }}>{selectedFood.nutrition[f.key] || 0}{f.unit}</span>
                </span>
              ))}
            </div>
          </div>
          <FieldInput label={maxServings !== null ? `Servings (max ${Math.round(maxServings * 100) / 100})` : "Number of Servings"} value={servings} onChange={setServings} type="number" placeholder="1" step="any" />
          {/* Meal tag picker */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Meal</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {MEAL_TAGS.map(t => (
                <button key={t.key} onClick={() => setMealTag(t.key)} style={{
                  padding: "5px 10px", borderRadius: 16, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  background: mealTag === t.key ? "var(--accent)" : "var(--input-bg)",
                  color: mealTag === t.key ? "#fff" : "var(--text-muted)",
                }}>{t.emoji} {t.label}</button>
              ))}
            </div>
          </div>
          {servingsExceedsMax && (
            <div style={{ fontSize: 12, color: "#EF4444", marginTop: -8, marginBottom: 8 }}>
              Only {Math.round(maxServings * 100) / 100} servings remaining
            </div>
          )}
          {parseFloat(servings) > 0 && !servingsExceedsMax && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>Total:</span>
              {enabledFields.map(f => (
                <span key={f.key}>{f.label}: {Math.round(((selectedFood.nutrition[f.key] || 0) * parseFloat(servings)) * 10) / 10}{f.unit}</span>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 8, marginTop: 4 }}>
            <Btn variant="secondary" onClick={() => setSelectedFood(null)} style={{ width: "auto", padding: "11px 16px" }}>←</Btn>
            <Btn variant="secondary" onClick={handleQueue} disabled={!servings || parseFloat(servings) <= 0 || servingsExceedsMax}>Queue</Btn>
            <Btn onClick={handleAdd} disabled={!servings || parseFloat(servings) <= 0 || servingsExceedsMax}>Add</Btn>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 6 }}>
            Queue = planned, doesn't count until checked off
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Add Custom Field Modal ──────────────────────────────────────

function AddFieldModal({ open, onClose, onAdd }) {
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("");

  useEffect(() => { if (open) { setLabel(""); setUnit(""); } }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Add Custom Field">
      <FieldInput label="Field Name" value={label} onChange={setLabel} placeholder="e.g. Omega-3" />
      <FieldInput label="Unit" value={unit} onChange={setUnit} placeholder="e.g. mg" />
      <Btn onClick={() => { if (label.trim()) onAdd(label.trim(), unit.trim() || "g"); }} disabled={!label.trim()}>
        Add Field
      </Btn>
    </Modal>
  );
}

// ─── Add Category Modal ──────────────────────────────────────────

function AddCategoryModal({ open, onClose, onAdd, existingCategories }) {
  const [name, setName] = useState("");

  useEffect(() => { if (open) setName(""); }, [open]);

  const isDuplicate = existingCategories.some(c => c.toLowerCase() === name.trim().toLowerCase());

  return (
    <Modal open={open} onClose={onClose} title="Add Category">
      <FieldInput label="Category Name" value={name} onChange={setName} placeholder="e.g. Supplements" />
      {isDuplicate && (
        <div style={{ fontSize: 12, color: "#EF4444", marginTop: -8, marginBottom: 12 }}>
          This category already exists.
        </div>
      )}
      <Btn onClick={() => { if (name.trim() && !isDuplicate) onAdd(name.trim()); }} disabled={!name.trim() || isDuplicate}>
        Add Category
      </Btn>
    </Modal>
  );
}

// ─── Meal Grouped Entries ─────────────────────────────────────────

function MealGroupedEntries({ entries, foods, allFields, enabledFields, onRemove, onCheckOff, onEdit }) {
  const [expanded, setExpanded] = useState({});

  const groups = {};
  MEAL_TAGS.forEach(t => { groups[t.key] = []; });
  entries.forEach(entry => {
    const tag = entry.mealTag || "other";
    if (!groups[tag]) groups[tag] = [];
    groups[tag].push(entry);
  });

  const getEntryNutrition = (entry) => {
    const totals = {};
    allFields.forEach(f => { totals[f.key] = 0; });
    if (entry.isQuickAdd) {
      allFields.forEach(f => { totals[f.key] = entry.values?.[f.key] || 0; });
    } else {
      const food = foods.find(f => f.id === entry.foodId);
      if (food) allFields.forEach(f => { totals[f.key] = (food.nutrition[f.key] || 0) * (entry.servings || 1); });
    }
    return totals;
  };

  const getGroupTotals = (groupEntries) => {
    const totals = {};
    allFields.forEach(f => { totals[f.key] = 0; });
    groupEntries.forEach(entry => {
      const n = getEntryNutrition(entry);
      allFields.forEach(f => { totals[f.key] = (totals[f.key] || 0) + (n[f.key] || 0); });
    });
    return totals;
  };

  return (
    <>
      {MEAL_TAGS.map(tag => {
        const groupEntries = groups[tag.key] || [];
        if (groupEntries.length === 0) return null;
        const groupTotals = getGroupTotals(groupEntries);
        const isOpen = expanded[tag.key];
        const hasPlanned = groupEntries.some(e => e.planned);
        return (
          <div key={tag.key} style={{ marginBottom: 8 }}>
            {/* Group header */}
            <div onClick={() => setExpanded({ ...expanded, [tag.key]: !isOpen })} style={{
              background: "var(--card-bg)", borderRadius: isOpen ? "12px 12px 0 0" : 12,
              padding: "11px 14px", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderLeft: hasPlanned ? "3px solid #3B82F6" : "3px solid var(--accent)",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  {tag.emoji} {tag.label}
                  <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>({groupEntries.length})</span>
                  {hasPlanned && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6, background: "#DBEAFE", color: "#1D4ED8" }}>PLANNED</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {enabledFields.slice(0, 4).map(f => (
                    groupTotals[f.key] > 0 ? (
                      <span key={f.key}><span style={{ fontWeight: 600, color: "var(--text)" }}>{Math.round(groupTotals[f.key] * 10) / 10}</span>{f.unit} {f.label}</span>
                    ) : null
                  ))}
                </div>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 14, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
            </div>
            {/* Expanded entries */}
            {isOpen && (
              <div style={{ background: "var(--card-bg)", borderRadius: "0 0 12px 12px", borderTop: "1px solid var(--border)", padding: "0 0 4px" }}>
                {groupEntries.map(entry => {
                  const isPlanned = !!entry.planned;
                  const name = entry.isQuickAdd ? (entry.quickLabel || "Quick Add") : (foods.find(f => f.id === entry.foodId)?.name || "Unknown");
                  const n = getEntryNutrition(entry);
                  return (
                    <div key={entry.id} style={{
                      display: "flex", alignItems: "center", padding: "10px 14px",
                      borderBottom: "1px solid var(--border)", gap: 8,
                      background: isPlanned ? "#F0F7FF" : "transparent",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {!entry.isQuickAdd && <span>{entry.servings} serving{entry.servings !== 1 ? "s" : ""}</span>}
                          {enabledFields.slice(0, 3).map(f => n[f.key] > 0 ? (
                            <span key={f.key}>{Math.round(n[f.key] * 10) / 10}{f.unit} {f.label}</span>
                          ) : null)}
                          {!isPlanned && entry.time && <span>· {entry.time}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                        {isPlanned && (
                          <button onClick={() => onCheckOff(entry.id)} style={{
                            background: "#3B82F6", border: "none", borderRadius: 8, color: "#fff",
                            cursor: "pointer", padding: "4px 10px", fontSize: 13, fontWeight: 600,
                          }}>✓</button>
                        )}
                        <button onClick={() => onEdit(entry)} style={{
                          background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "2px 6px",
                        }}>edit</button>
                        <button onClick={() => onRemove(entry.id)} style={{
                          background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: 2,
                        }}>×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Edit Entry Modal ─────────────────────────────────────────────

function EditEntryModal({ entry, date, foods, enabledFields, allFields, onSave, onClose }) {
  const food = !entry.isQuickAdd ? foods.find(f => f.id === entry.foodId) : null;

  // For quick-add entries
  const [label, setLabel] = useState(entry.quickLabel || "");
  const [values, setValues] = useState(
    Object.fromEntries(enabledFields.map(f => [f.key, entry.values?.[f.key] !== undefined ? String(entry.values[f.key]) : ""]))
  );
  // For food entries
  const [servings, setServings] = useState(String(entry.servings || 1));
  // Shared
  const [mealTag, setMealTag] = useState(entry.mealTag || "other");

  function handleSave() {
    if (entry.isQuickAdd) {
      const parsed = {};
      for (const [k, v] of Object.entries(values)) {
        parsed[k] = typeof v === 'string' ? (parseFloat(v) || 0) : (v || 0);
      }
      onSave({ ...entry, quickLabel: label.trim() || entry.quickLabel, values: parsed, mealTag });
    } else {
      onSave({ ...entry, servings: parseFloat(servings) || 1, mealTag });
    }
  }

  return (
    <Modal open={true} onClose={onClose} title="Edit Entry">
      {entry.isQuickAdd ? (
        <>
          <FieldInput label="Label" value={label} onChange={setLabel} placeholder="Entry name" />
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", margin: "4px 0 8px" }}>
            Nutrition
          </div>
          {enabledFields.map(f => (
            <FieldInput key={f.key} label={f.label} unit={f.unit} type="number" step="any" placeholder="0"
              value={values[f.key] !== undefined ? values[f.key] : ""}
              onChange={v => setValues({ ...values, [f.key]: v })}
            />
          ))}
        </>
      ) : (
        <>
          <div style={{ background: "var(--input-bg)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{food?.name || "Unknown food"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Per {food?.servingSize} {food?.servingUnit}
            </div>
          </div>
          <FieldInput label="Servings" value={servings} onChange={setServings} type="number" step="any" placeholder="1" />
        </>
      )}

      {/* Meal tag */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Meal</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MEAL_TAGS.map(t => (
            <button key={t.key} onClick={() => setMealTag(t.key)} style={{
              padding: "5px 10px", borderRadius: 16, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)",
              background: mealTag === t.key ? "var(--accent)" : "var(--input-bg)",
              color: mealTag === t.key ? "#fff" : "var(--text-muted)",
            }}>{t.emoji} {t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave}>Save</Btn>
      </div>
    </Modal>
  );
}

// ─── Stats Panel ─────────────────────────────────────────────────

function StatsPanel({ logs, foods, enabledFields, computeTotals, goals, weightLog, allFields, caloriePlan, weeklyPlan, tdeeForPlan }) {
  const [range, setRange] = useState("7");
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const sortedDays = Object.keys(logs).sort((a, b) => b.localeCompare(a));

  const daysToUse = range === "all"
    ? sortedDays
    : sortedDays.filter(d => {
        const diff = (new Date() - new Date(d + "T12:00:00")) / (1000 * 60 * 60 * 24);
        return diff <= parseInt(range);
      });

  const dayTotals = daysToUse.map(d => computeTotals(logs[d]));

  const averages = {};
  enabledFields.forEach(f => {
    const sum = dayTotals.reduce((acc, t) => acc + (t[f.key] || 0), 0);
    averages[f.key] = daysToUse.length > 0 ? sum / daysToUse.length : 0;
  });

  // Meal tag breakdown across selected range
  const mealTotals = {};
  MEAL_TAGS.forEach(t => { mealTotals[t.key] = { calories: 0, days: 0 }; });
  let totalCaloriesAllMeals = 0;
  daysToUse.forEach(day => {
    const entries = logs[day] || [];
    entries.forEach(entry => {
      const tag = entry.mealTag || "other";
      let cals = 0;
      if (entry.isQuickAdd) {
        cals = entry.values?.calories || 0;
      } else {
        const food = foods.find(f => f.id === entry.foodId);
        if (food) cals = (food.nutrition?.calories || 0) * (entry.servings || 1);
      }
      if (!mealTotals[tag]) mealTotals[tag] = { calories: 0, days: 0 };
      mealTotals[tag].calories += cals;
      totalCaloriesAllMeals += cals;
    });
  });

  // Group daysToUse by week (Mon-Sun)
  const weekGroups = {};
  daysToUse.forEach(day => {
    const monday = getWeekMonday(day);
    if (!weekGroups[monday]) weekGroups[monday] = [];
    weekGroups[monday].push(day);
  });
  const sortedWeeks = Object.keys(weekGroups).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["7", "7 days"], ["14", "14 days"], ["30", "30 days"], ["all", "All time"]].map(([v, label]) => (
          <button key={v} onClick={() => setRange(v)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: range === v ? "var(--accent)" : "var(--card-bg)", color: range === v ? "#fff" : "var(--text-muted)",
            fontFamily: "var(--font-body)", transition: "all 0.2s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {daysToUse.length === 0 ? (
        <EmptyState icon="📊" title="No data yet" subtitle="Log some food to see your averages" />
      ) : (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>
            Daily Averages ({daysToUse.length} day{daysToUse.length !== 1 ? "s" : ""})
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {enabledFields.map((f, i) => {
              const avg = averages[f.key] || 0;
              const goal = goals[f.key] || 0;
              const pct = goal > 0 ? Math.round((avg / goal) * 100) : null;
              return (
                <div key={f.key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px",
                  borderBottom: i < enabledFields.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{f.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                      {Math.round(avg * 10) / 10}
                      <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2, fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>{f.unit}</span>
                    </span>
                    {pct !== null && (
                      <div style={{ fontSize: 11, color: pct >= 90 ? "var(--success)" : "var(--text-muted)" }}>
                        {pct}% of goal
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* TDEE Analysis */}
          {(() => {
            const smoothed = computeSmoothedWeights(weightLog);
            const tdeeData = computeTDEE(smoothed, logs, allFields, foods, 28);
            if (!tdeeData) return (
              <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: "16px", marginTop: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--accent)", marginBottom: 8 }}>
                  Estimated TDEE
                </div>
                {(() => {
                  const prog = computeTDEEProgress(weightLog, logs);
                  return (
                    <div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                        Log weight and food daily to unlock your TDEE estimate.
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1, background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Weight Logs</div>
                          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: prog.weightNeeded === 0 ? "var(--success)" : "var(--text)" }}>
                            {prog.weightDays}<span style={{ fontSize: 12, fontWeight: 400, fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>/14</span>
                          </div>
                          {prog.weightNeeded > 0 && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>{prog.weightNeeded} more needed</div>}
                          {prog.weightNeeded === 0 && <div style={{ fontSize: 11, color: "var(--success)", marginTop: 2 }}>Ready</div>}
                        </div>
                        <div style={{ flex: 1, background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Food Logs</div>
                          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: prog.foodNeeded === 0 ? "var(--success)" : "var(--text)" }}>
                            {prog.foodDays}<span style={{ fontSize: 12, fontWeight: 400, fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>/7</span>
                          </div>
                          {prog.foodNeeded > 0 && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>{prog.foodNeeded} more needed</div>}
                          {prog.foodNeeded === 0 && <div style={{ fontSize: 11, color: "var(--success)", marginTop: 2 }}>Ready</div>}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
            const gaining = tdeeData.weeklyRateLbs > 0.05;
            const losing = tdeeData.weeklyRateLbs < -0.05;
            const maintaining = !gaining && !losing;
            return (
              <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: "16px", marginTop: 16, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--accent)", marginBottom: 12 }}>
                  Estimated TDEE
                </div>
                {/* Big TDEE number */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--text)" }}>
                    {tdeeData.tdee}
                    <span style={{ fontSize: 14, fontWeight: 400, fontFamily: "var(--font-body)", color: "var(--text-muted)", marginLeft: 4 }}>kcal/day</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                    Estimated maintenance calories
                  </div>
                </div>
                {/* Details grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>Avg Intake</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)" }}>{tdeeData.avgDailyCalories} <span style={{ fontSize: 11, fontWeight: 400, fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>kcal</span></div>
                  </div>
                  <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>Weekly Rate</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)", color: losing ? "var(--success)" : gaining ? "#EF4444" : "var(--text)" }}>
                      {tdeeData.weeklyRateLbs > 0 ? "+" : ""}{tdeeData.weeklyRateLbs} <span style={{ fontSize: 11, fontWeight: 400, fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>lbs/wk</span>
                    </div>
                  </div>
                  <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>Smoothed Start</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)" }}>{tdeeData.startWeight} <span style={{ fontSize: 11, fontWeight: 400, fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>lbs</span></div>
                  </div>
                  <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>Smoothed Now</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)" }}>{tdeeData.endWeight} <span style={{ fontSize: 11, fontWeight: 400, fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>lbs</span></div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>
                  Based on {tdeeData.daysAnalyzed} days of weight data & {tdeeData.daysWithFoodLog} days of food logs
                </div>
              </div>
            );
          })()}

          {/* Calorie Plan & Weekly View */}
          {(() => {
            if (!tdeeForPlan || !weeklyPlan) return null;
            const baseTargets = computePlanTargets(caloriePlan, tdeeForPlan.tdee, todayStr());
            if (!baseTargets) return null;
            const today = todayStr();
            const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            return (
              <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: "16px", marginTop: 16, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--accent)", marginBottom: 12 }}>
                  Calorie Plan
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                  Rate: <span style={{ fontWeight: 600, color: "var(--text)" }}>{caloriePlan.weeklyRate > 0 ? "+" : ""}{caloriePlan.weeklyRate} lbs/week</span>
                  {" → "}
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{Math.round(Math.abs(caloriePlan.weeklyRate) * 500)} kcal/day {caloriePlan.weeklyRate < 0 ? "deficit" : caloriePlan.weeklyRate > 0 ? "surplus" : ""}</span>
                </div>
                <div style={{ background: "var(--accent-light)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>Weekly avg target</span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--accent)" }}>
                    {Math.round(weeklyPlan.weeklyCalTarget / 7)} kcal/day
                  </span>
                </div>

                {/* Weekly summary bar */}
                <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Weekly Total</span>
                    <span>
                      <span style={{ fontWeight: 700 }}>{Math.round(weeklyPlan.pastActualCals)}</span>
                      <span style={{ color: "var(--text-muted)" }}> / {weeklyPlan.weeklyCalTarget} kcal</span>
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3, transition: "width 0.4s",
                      width: `${Math.min((weeklyPlan.pastActualCals / weeklyPlan.weeklyCalTarget) * 100, 100)}%`,
                      background: weeklyPlan.pastActualCals > weeklyPlan.weeklyCalTarget ? "#EF4444" : "var(--accent)",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>
                    <span style={{ fontWeight: 600, color: weeklyPlan.remainingBudget >= 0 ? "var(--success)" : "#EF4444" }}>
                      {Math.round(weeklyPlan.remainingBudget)}
                    </span> remaining · {weeklyPlan.remainingDays} days left
                  </div>
                </div>

                {/* Per-day breakdown */}
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: "var(--text-muted)", marginBottom: 6 }}>
                  This Week
                </div>
                {weeklyPlan.weekDays.map((day, i) => {
                  const raw = weeklyPlan.rawTargets[i];
                  const actual = weeklyPlan.actuals[i];
                  const adjusted = weeklyPlan.adjustedTargets[day];
                  const isPast = day < today;
                  const isToday = day === today;
                  const target = adjusted ? adjusted.calories : raw.calories;
                  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
                  return (
                    <div key={day} style={{
                      display: "grid", gridTemplateColumns: "42px 1fr 55px", gap: 8, alignItems: "center",
                      padding: "6px 0", opacity: isPast ? 0.7 : 1,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? "var(--accent)" : "var(--text)" }}>
                        {dayLabels[i]}
                        {raw.dayType && <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 400 }}>{raw.dayType}</div>}
                      </div>
                      <div style={{ position: "relative", height: 6, borderRadius: 3, background: "var(--border)" }}>
                        <div style={{
                          height: "100%", borderRadius: 3,
                          width: `${pct}%`,
                          background: isPast ? (actual > target * 1.05 ? "#EF4444" : "var(--success)") : isToday ? "var(--accent)" : "var(--border)",
                          transition: "width 0.3s",
                        }} />
                      </div>
                      <div style={{ fontSize: 11, textAlign: "right" }}>
                        {isPast || isToday ? (
                          <span>
                            <span style={{ fontWeight: 600 }}>{Math.round(actual)}</span>
                            <span style={{ color: "var(--text-muted)" }}>/{target}</span>
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>
                            {adjusted && adjusted.isAdjusted ? (
                              <span style={{ fontWeight: 600 }}>{target}</span>
                            ) : (
                              target
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", margin: "20px 0 10px" }}>
            Calories by Meal
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 14, overflow: "hidden", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {MEAL_TAGS.map((tag, i) => {
              const data = mealTotals[tag.key] || { calories: 0 };
              const avgCals = daysToUse.length > 0 ? data.calories / daysToUse.length : 0;
              const pct = totalCaloriesAllMeals > 0 ? (data.calories / totalCaloriesAllMeals) * 100 : 0;
              if (data.calories === 0) return null;
              return (
                <div key={tag.key} style={{
                  padding: "10px 16px", borderBottom: i < MEAL_TAGS.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{tag.emoji} {tag.label}</span>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-heading)" }}>{Math.round(avgCals)}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}> kcal/day</span>
                      <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginLeft: 8 }}>{Math.round(pct)}%</span>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--border)" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: "var(--accent)", width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", margin: "0 0 10px" }}>
            Weekly Breakdown
          </div>
          {sortedWeeks.map(monday => {
            const weekDays = weekGroups[monday].sort((a, b) => a.localeCompare(b));
            const weekTotals = {};
            enabledFields.forEach(f => { weekTotals[f.key] = 0; });
            weekDays.forEach(day => {
              const t = computeTotals(logs[day] || []);
              enabledFields.forEach(f => { weekTotals[f.key] += t[f.key] || 0; });
            });
            const weekAvg = {};
            enabledFields.forEach(f => { weekAvg[f.key] = weekTotals[f.key] / weekDays.length; });
            const isOpen = expandedWeeks[monday];

            // Week label: Mon date - Sun date
            const weekEnd = new Date(monday + "T12:00:00");
            weekEnd.setDate(weekEnd.getDate() + 6);
            const weekLabel = `${formatDate(monday)} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

            return (
              <div key={monday} style={{ marginBottom: 8 }}>
                <div onClick={() => setExpandedWeeks({ ...expandedWeeks, [monday]: !isOpen })} style={{
                  background: "var(--card-bg)", borderRadius: isOpen ? "12px 12px 0 0" : 12,
                  padding: "12px 16px", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{weekLabel}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {weekDays.length} day{weekDays.length !== 1 ? "s" : ""} avg · {" "}
                      {enabledFields.slice(0, 3).map(f => `${Math.round(weekAvg[f.key] || 0)}${f.unit} ${f.label}`).join(" · ")}
                    </div>
                  </div>
                  <span style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                </div>
                {isOpen && (
                  <div style={{ background: "var(--card-bg)", borderRadius: "0 0 12px 12px", borderTop: "1px solid var(--border)", padding: "4px 0 8px" }}>
                    {weekDays.map(day => {
                      const totals = computeTotals(logs[day] || []);
                      return (
                        <div key={day} style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{formatDate(day)}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
                            {enabledFields.map(f => (
                              <span key={f.key} style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {f.label}: <span style={{ fontWeight: 600, color: "var(--text)" }}>{Math.round((totals[f.key] || 0) * 10) / 10}</span>{f.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}

// ─── Weight Panel ────────────────────────────────────────────────

function WeightPanel({ weightLog, setWeightLog, logs, foods, allFields }) {
  const [weight, setWeight] = useState("");
  const [editingDay, setEditingDay] = useState(null);
  const [editWeight, setEditWeight] = useState("");
  const today = todayStr();
  const todayLogged = weightLog[today] !== undefined;

  const smoothed = computeSmoothedWeights(weightLog);
  const smoothedReversed = [...smoothed].reverse();

  function logWeight() {
    const val = parseFloat(weight);
    if (!val || val <= 0) return;
    setWeightLog({ ...weightLog, [today]: val });
    setWeight("");
  }

  function updateWeight(day, val) {
    const num = parseFloat(val);
    if (!num || num <= 0) return;
    setWeightLog({ ...weightLog, [day]: num });
    setEditingDay(null);
    setEditWeight("");
  }

  function deleteWeight(day) {
    const updated = { ...weightLog };
    delete updated[day];
    setWeightLog(updated);
  }

  // Compute TDEE for display on this panel too
  const tdeeData = computeTDEE(smoothed, logs, allFields, foods, 28);

  return (
    <>
      {/* Log Today's Weight */}
      <div style={{
        background: todayLogged ? "var(--card-bg)" : "var(--accent)",
        borderRadius: 14, padding: "16px", marginBottom: 16,
        boxShadow: todayLogged ? "0 1px 4px rgba(0,0,0,0.04)" : "0 4px 20px rgba(232,103,46,0.25)",
      }}>
        {todayLogged ? (
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Today's Weight</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                {weightLog[today]} <span style={{ fontSize: 14, fontWeight: 400, fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>lbs</span>
              </div>
              {smoothed.length > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Smoothed</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)" }}>{smoothed[smoothed.length - 1].smoothed} lbs</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 10 }}>Log Today's Weight</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 175.5" step="0.1"
                style={{
                  flex: 1, padding: "10px 12px", border: "2px solid rgba(255,255,255,0.3)", borderRadius: 10,
                  fontSize: 16, background: "rgba(255,255,255,0.15)", color: "#fff", fontFamily: "var(--font-body)",
                  outline: "none", fontWeight: 600,
                }}
                onKeyDown={e => e.key === "Enter" && logWeight()}
              />
              <button onClick={logWeight} disabled={!weight || parseFloat(weight) <= 0} style={{
                padding: "10px 20px", borderRadius: 10, border: "2px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: !weight ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", opacity: !weight ? 0.4 : 1,
              }}>
                Log
              </button>
            </div>
          </>
        )}
      </div>

      {/* Quick TDEE Summary */}
      {tdeeData && (
        <div style={{
          background: "var(--card-bg)", borderRadius: 14, padding: "14px 16px", marginBottom: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-around", textAlign: "center",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>TDEE</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--accent)" }}>{tdeeData.tdee}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>kcal/day</div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>Rate</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: tdeeData.weeklyRateLbs < -0.05 ? "var(--success)" : tdeeData.weeklyRateLbs > 0.05 ? "#EF4444" : "var(--text)" }}>
              {tdeeData.weeklyRateLbs > 0 ? "+" : ""}{tdeeData.weeklyRateLbs}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>lbs/week</div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>Trend</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)" }}>{tdeeData.endWeight}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>lbs smoothed</div>
          </div>
        </div>
      )}

      {/* Weight History */}
      <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 8 }}>
        History
      </div>
      {smoothedReversed.length === 0 ? (
        <EmptyState icon="⚖️" title="No weight entries" subtitle="Log your weight to start tracking" />
      ) : (
        <>
          {/* Header row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 70px 70px 36px", gap: 8, padding: "8px 14px",
            fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px",
          }}>
            <span>Date</span>
            <span style={{ textAlign: "right" }}>Weight</span>
            <span style={{ textAlign: "right" }}>Smoothed</span>
            <span />
          </div>
          {smoothedReversed.map(entry => (
            <div key={entry.date} style={{
              display: "grid", gridTemplateColumns: "1fr 70px 70px 36px", gap: 8, alignItems: "center",
              background: "var(--card-bg)", borderRadius: 10, padding: "10px 14px", marginBottom: 4,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(entry.date)}</span>
              {editingDay === entry.date ? (
                <input
                  type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} step="0.1" autoFocus
                  onBlur={() => { if (editWeight) updateWeight(entry.date, editWeight); else setEditingDay(null); }}
                  onKeyDown={e => { if (e.key === "Enter") updateWeight(entry.date, editWeight); if (e.key === "Escape") setEditingDay(null); }}
                  style={{
                    width: "100%", padding: "4px 6px", border: "1.5px solid var(--accent)", borderRadius: 6,
                    fontSize: 13, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)",
                    outline: "none", textAlign: "right", fontWeight: 600,
                  }}
                />
              ) : (
                <span onClick={() => { setEditingDay(entry.date); setEditWeight(String(entry.raw)); }}
                  style={{ fontSize: 14, fontWeight: 600, textAlign: "right", cursor: "pointer" }}>
                  {entry.raw}
                </span>
              )}
              <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: "var(--text-muted)" }}>
                {entry.smoothed}
              </span>
              <button onClick={() => { if (confirm("Delete this entry?")) deleteWeight(entry.date); }} style={{
                background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2,
              }}>×</button>
            </div>
          ))}
        </>
      )}
    </>
  );
}

// ─── Symptoms Panel ──────────────────────────────────────────────

function SymptomsPanel({ symptomLog, setSymptomLog }) {
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const [ratings, setRatings] = useState({});
  const [filterDay, setFilterDay] = useState(null);

  function submitEntry() {
    const entry = {
      id: generateId(),
      date: todayStr(),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      note: note.trim(),
      symptoms: { ...ratings },
    };
    setSymptomLog([entry, ...symptomLog]);
    setNote("");
    setRatings({});
    setShowForm(false);
  }

  function deleteEntry(id) {
    setSymptomLog(symptomLog.filter(e => e.id !== id));
  }

  const days = {};
  symptomLog.forEach(entry => {
    const d = entry.date || "unknown";
    if (!days[d]) days[d] = [];
    days[d].push(entry);
  });
  const sortedDays = Object.keys(days).sort((a, b) => b.localeCompare(a));
  const displayDays = filterDay ? sortedDays.filter(d => d === filterDay) : sortedDays;

  return (
    <>
      <Btn onClick={() => setShowForm(!showForm)} style={{ marginBottom: 16 }}>
        {showForm ? "Cancel" : "+ Log Symptoms"}
      </Btn>

      {showForm && (
        <div style={{
          background: "var(--card-bg)", borderRadius: 14, padding: "16px", marginBottom: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>
            How are you feeling?
          </div>
          {DEFAULT_SYMPTOMS.map(s => (
            <div key={s.key} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.emoji} {s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-heading)", color: ratings[s.key] ? "var(--accent)" : "var(--text-muted)", minWidth: 20, textAlign: "right" }}>
                  {ratings[s.key] || "—"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setRatings({ ...ratings, [s.key]: ratings[s.key] === n ? undefined : n })} style={{
                    flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: "none", fontFamily: "var(--font-body)", transition: "all 0.15s",
                    background: ratings[s.key] === n ? "var(--accent)" : "var(--input-bg)",
                    color: ratings[s.key] === n ? "#fff" : "var(--text-muted)",
                  }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 6, marginTop: 4 }}>
            Notes
          </div>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="How are you feeling? Any observations..."
            rows={3}
            style={{
              width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 10,
              fontSize: 14, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)",
              outline: "none", resize: "vertical", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />

          <Btn onClick={submitEntry} disabled={Object.keys(ratings).filter(k => ratings[k]).length === 0 && !note.trim()} style={{ marginTop: 12 }}>
            Save Entry
          </Btn>
        </div>
      )}

      {sortedDays.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
          <button onClick={() => setFilterDay(null)} style={{
            padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "none", whiteSpace: "nowrap", fontFamily: "var(--font-body)",
            background: !filterDay ? "var(--accent)" : "var(--card-bg)", color: !filterDay ? "#fff" : "var(--text-muted)",
          }}>All</button>
          {sortedDays.slice(0, 10).map(d => (
            <button key={d} onClick={() => setFilterDay(filterDay === d ? null : d)} style={{
              padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: "none", whiteSpace: "nowrap", fontFamily: "var(--font-body)",
              background: filterDay === d ? "var(--accent)" : "var(--card-bg)", color: filterDay === d ? "#fff" : "var(--text-muted)",
            }}>{formatDate(d)}</button>
          ))}
        </div>
      )}

      {symptomLog.length === 0 ? (
        <EmptyState icon="📝" title="No entries yet" subtitle="Log how you're feeling to start tracking patterns" />
      ) : (
        displayDays.map(day => (
          <div key={day}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--accent)", padding: "8px 0 4px" }}>
              {formatDate(day)}
            </div>
            {days[day].map(entry => (
              <div key={entry.id} style={{
                background: "var(--card-bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 8,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{entry.time}</div>
                  <button onClick={() => { if (confirm("Delete this entry?")) deleteEntry(entry.id); }} style={{
                    background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2,
                  }}>×</button>
                </div>
                {Object.keys(entry.symptoms || {}).filter(k => entry.symptoms[k]).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: entry.note ? 8 : 0 }}>
                    {DEFAULT_SYMPTOMS.map(s => {
                      const val = entry.symptoms?.[s.key];
                      if (!val) return null;
                      const intensity = val <= 3 ? "#3B82F6" : val <= 6 ? "#F59E0B" : "#EF4444";
                      return (
                        <span key={s.key} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                          background: "var(--input-bg)", color: "var(--text)",
                        }}>
                          {s.emoji} {s.label}
                          <span style={{ color: intensity, fontFamily: "var(--font-heading)", fontSize: 13 }}>{val}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
                {entry.note && (
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {entry.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </>
  );
}

// ─── Bowel Panel ─────────────────────────────────────────────────

const BRISTOL_SCALE = [
  { score: 1, label: "Hard lumps", desc: "Separate hard lumps, like nuts", color: "#8B4513", icon: "●●●" },
  { score: 2, label: "Lumpy sausage", desc: "Sausage-shaped but lumpy", color: "#A0522D", icon: "▓▓" },
  { score: 3, label: "Cracked sausage", desc: "Like a sausage with cracks", color: "#CD853F", icon: "▒▒" },
  { score: 4, label: "Smooth snake", desc: "Smooth and soft, like a snake", color: "#22C55E", icon: "═══" },
  { score: 5, label: "Soft blobs", desc: "Soft blobs with clear edges", color: "#86EFAC", icon: "○○" },
  { score: 6, label: "Mushy", desc: "Fluffy pieces with ragged edges", color: "#F59E0B", icon: "～～" },
  { score: 7, label: "Liquid", desc: "Watery, no solid pieces", color: "#EF4444", icon: "≋≋" },
];

function BowelPanel({ bowelLog, setBowelLog }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);
  const [note, setNote] = useState("");

  function submitEntry() {
    if (!selectedScore) return;
    const entry = {
      id: generateId(),
      date: todayStr(),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      bristol: selectedScore,
      note: note.trim(),
    };
    setBowelLog([entry, ...bowelLog]);
    setSelectedScore(null);
    setNote("");
    setShowForm(false);
  }

  function deleteEntry(id) {
    setBowelLog(bowelLog.filter(e => e.id !== id));
  }

  const days = {};
  bowelLog.forEach(entry => {
    const d = entry.date || "unknown";
    if (!days[d]) days[d] = [];
    days[d].push(entry);
  });
  const sortedDays = Object.keys(days).sort((a, b) => b.localeCompare(a));

  const last7 = bowelLog.filter(e => {
    const diff = (new Date() - new Date(e.timestamp)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const avgBristol = last7.length > 0 ? (last7.reduce((s, e) => s + e.bristol, 0) / last7.length) : null;
  const freqPerDay = last7.length > 0 ? (last7.length / 7) : null;
  const daysSinceLast = bowelLog.length > 0
    ? Math.round((new Date() - new Date(bowelLog[0].timestamp)) / (1000 * 60 * 60 * 24) * 10) / 10
    : null;

  return (
    <>
      {bowelLog.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "10px 12px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>Last</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)", color: daysSinceLast > 2 ? "#EF4444" : daysSinceLast > 1 ? "#F59E0B" : "var(--success)" }}>
              {daysSinceLast < 0.1 ? "Today" : daysSinceLast < 1 ? `${Math.round(daysSinceLast * 24)}h` : `${Math.round(daysSinceLast)}d`}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>ago</div>
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "10px 12px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>7d Avg</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)", color: avgBristol && (avgBristol >= 3 && avgBristol <= 4) ? "var(--success)" : "var(--text)" }}>
              {avgBristol ? avgBristol.toFixed(1) : "—"}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>bristol</div>
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "10px 12px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>7d Freq</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)", color: freqPerDay && freqPerDay >= 0.7 ? "var(--success)" : "#F59E0B" }}>
              {freqPerDay ? freqPerDay.toFixed(1) : "—"}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>/day</div>
          </div>
        </div>
      )}

      <Btn onClick={() => setShowForm(!showForm)} style={{ marginBottom: 16 }}>
        {showForm ? "Cancel" : "+ Log Bowel Movement"}
      </Btn>

      {showForm && (
        <div style={{
          background: "var(--card-bg)", borderRadius: 14, padding: "16px", marginBottom: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>
            Bristol Stool Scale
          </div>
          {BRISTOL_SCALE.map(b => (
            <div key={b.score} onClick={() => setSelectedScore(selectedScore === b.score ? null : b.score)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 4,
              borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
              background: selectedScore === b.score ? "var(--accent)" : "var(--input-bg)",
              color: selectedScore === b.score ? "#fff" : "var(--text)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, fontFamily: "var(--font-heading)",
                background: selectedScore === b.score ? "rgba(255,255,255,0.2)" : b.color,
                color: "#fff",
              }}>
                {b.score}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{b.label}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{b.desc}</div>
              </div>
              <div style={{ fontSize: 14, letterSpacing: 1, opacity: 0.5 }}>{b.icon}</div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", margin: "8px 0", fontStyle: "italic" }}>
            Types 3-4 are considered ideal
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 6, marginTop: 8 }}>
            Notes (optional)
          </div>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Any observations..."
            rows={2}
            style={{
              width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 10,
              fontSize: 14, background: "var(--input-bg)", color: "var(--text)", fontFamily: "var(--font-body)",
              outline: "none", resize: "vertical", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />

          <Btn onClick={submitEntry} disabled={!selectedScore} style={{ marginTop: 12 }}>
            Save Entry
          </Btn>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 8 }}>
        History
      </div>
      {bowelLog.length === 0 ? (
        <EmptyState icon="📋" title="No entries yet" subtitle="Log your first bowel movement to start tracking" />
      ) : (
        sortedDays.map(day => (
          <div key={day}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--accent)", padding: "8px 0 4px" }}>
              {formatDate(day)} · {days[day].length}×
            </div>
            {days[day].map(entry => {
              const bristol = BRISTOL_SCALE.find(b => b.score === entry.bristol);
              return (
                <div key={entry.id} style={{
                  background: "var(--card-bg)", borderRadius: 12, padding: "12px 14px", marginBottom: 6,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, fontFamily: "var(--font-heading)",
                    background: bristol?.color || "var(--border)", color: "#fff", flexShrink: 0,
                  }}>
                    {entry.bristol}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {bristol?.label || `Type ${entry.bristol}`}
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>{entry.time}</span>
                    </div>
                    {entry.note && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, whiteSpace: "pre-wrap" }}>{entry.note}</div>
                    )}
                  </div>
                  <button onClick={() => { if (confirm("Delete this entry?")) deleteEntry(entry.id); }} style={{
                    background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2, flexShrink: 0,
                  }}>×</button>
                </div>
              );
            })}
          </div>
        ))
      )}
    </>
  );
}

