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

const STORAGE_KEYS = {
  foods: "mt_foods",
  logs: "mt_logs",
  fields: "mt_fields",
  customFields: "mt_custom_fields",
  goals: "mt_goals",
  categories: "mt_categories",
  weightLog: "mt_weight_log",
  bounds: "mt_bounds",
};

const TABS = ["today", "weight", "foods", "log", "stats", "settings"];
const TAB_LABELS = { today: "Today", weight: "Weight", foods: "Foods", log: "Log", stats: "Stats", settings: "Settings" };
const TAB_ICONS = {
  today: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  weight: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  foods: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  log: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
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
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} step={step}
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
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddField, setShowAddField] = useState(false);
  const [showQuickWater, setShowQuickWater] = useState(false);
  const [categories, setCategories] = useState(() => loadData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES));
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addFoodCategory, setAddFoodCategory] = useState(null);
  const [weightLog, setWeightLog] = useState(() => loadData(STORAGE_KEYS.weightLog, {}));
  const [bounds, setBounds] = useState(() => loadData(STORAGE_KEYS.bounds, {}));

  useEffect(() => saveData(STORAGE_KEYS.foods, foods), [foods]);
  useEffect(() => saveData(STORAGE_KEYS.logs, logs), [logs]);
  useEffect(() => saveData(STORAGE_KEYS.fields, fields), [fields]);
  useEffect(() => saveData(STORAGE_KEYS.customFields, customFields), [customFields]);
  useEffect(() => saveData(STORAGE_KEYS.goals, goals), [goals]);
  useEffect(() => saveData(STORAGE_KEYS.categories, categories), [categories]);
  useEffect(() => saveData(STORAGE_KEYS.weightLog, weightLog), [weightLog]);
  useEffect(() => saveData(STORAGE_KEYS.bounds, bounds), [bounds]);

  const allFields = [...fields, ...customFields];
  const enabledFields = allFields.filter(f => f.enabled);
  const today = todayStr();
  const todayEntries = logs[today] || [];

  const computeTotals = useCallback((entries) => {
    const totals = {};
    allFields.forEach(f => { totals[f.key] = 0; });
    entries.forEach(entry => {
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

  const todayTotals = computeTotals(todayEntries);

  function addLogEntry(foodId, servings) {
    const newLogs = { ...logs };
    if (!newLogs[today]) newLogs[today] = [];
    newLogs[today] = [...newLogs[today], { id: generateId(), foodId, servings, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
    setLogs(newLogs);
  }

  function addQuickEntry(fieldKey, amount) {
    const newLogs = { ...logs };
    if (!newLogs[today]) newLogs[today] = [];
    newLogs[today] = [...newLogs[today], {
      id: generateId(),
      isQuickAdd: true,
      quickLabel: allFields.find(f => f.key === fieldKey)?.label || fieldKey,
      values: { [fieldKey]: amount },
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
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
    setFoods(foods.filter(f => f.id !== id));
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

  const sortedDays = Object.keys(logs).sort((a, b) => b.localeCompare(a));

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
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{formatDate(today)}</div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px 16px" }}>

        {/* ═══ TODAY TAB ═══ */}
        {tab === "today" && (
          <>
            {/* Progress Bars */}
            {enabledFields.map(f => (
              <ProgressBar
                key={f.key}
                field={f}
                current={todayTotals[f.key] || 0}
                goal={goals[f.key] || 0}
                isCalories={f.key === "calories"}
                lower={bounds[f.key]?.lower}
                upper={bounds[f.key]?.upper}
              />
            ))}

            {/* Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, marginBottom: 16 }}>
              <Btn onClick={() => setShowLogEntry(true)}>+ Log Food</Btn>
              <Btn variant="secondary" onClick={() => setShowQuickWater(true)}>+ Log Water</Btn>
            </div>

            {/* Today's Entries */}
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 8 }}>
              Today's Entries
            </div>
            {todayEntries.length === 0 ? (
              <EmptyState icon="🍽" title="No entries yet" subtitle="Tap 'Log Food' to get started" />
            ) : (
              todayEntries.map(entry => {
                if (entry.isQuickAdd) {
                  const val = Object.entries(entry.values || {})[0];
                  const field = allFields.find(f => f.key === val?.[0]);
                  return (
                    <div key={entry.id} style={{
                      background: "var(--card-bg)", borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{entry.quickLabel || "Quick Add"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          +{val?.[1]}{field?.unit || ""} · {entry.time}
                        </div>
                      </div>
                      <button onClick={() => removeLogEntry(today, entry.id)} style={{
                        background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, fontSize: 18, lineHeight: 1,
                      }}>×</button>
                    </div>
                  );
                }
                const food = foods.find(f => f.id === entry.foodId);
                if (!food) return null;
                return (
                  <div key={entry.id} style={{
                    background: "var(--card-bg)", borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{food.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {entry.servings} serving{entry.servings !== 1 ? "s" : ""} · {entry.time}
                        {enabledFields.length > 0 && " · "}
                        {enabledFields.slice(0, 3).map(f => `${Math.round((food.nutrition[f.key] || 0) * entry.servings)}${f.unit}`).join(" / ")}
                      </div>
                    </div>
                    <button onClick={() => removeLogEntry(today, entry.id)} style={{
                      background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, fontSize: 18, lineHeight: 1,
                    }}>×</button>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ═══ FOODS TAB ═══ */}
        {tab === "foods" && (
          <>
            <Btn onClick={() => { setEditFood(null); setAddFoodCategory(null); setShowAddFood(true); }} style={{ marginBottom: 16 }}>
              + Add Food Item
            </Btn>
            {foods.length === 0 ? (
              <EmptyState icon="📦" title="No foods yet" subtitle="Add your first food item to get started" />
            ) : (
              categories.map(cat => {
                const catFoods = foods.filter(f => (f.category || "Other") === cat);
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
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", borderLeft: "3px solid var(--accent)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>{food.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                              Serving: {food.servingSize} {food.servingUnit}
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
              const uncategorized = foods.filter(f => f.category && !categories.includes(f.category));
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
        {tab === "log" && (
          <>
            {sortedDays.length === 0 ? (
              <EmptyState icon="📋" title="No history" subtitle="Start logging food to see your daily summaries" />
            ) : (
              sortedDays.map(day => {
                const entries = logs[day];
                const totals = computeTotals(entries);
                const isSelected = selectedDay === day;
                return (
                  <div key={day} style={{ marginBottom: 10 }}>
                    <div onClick={() => setSelectedDay(isSelected ? null : day)} style={{
                      background: "var(--card-bg)", borderRadius: isSelected ? "12px 12px 0 0" : 12, padding: "14px 16px", cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(day)}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          {entries.length} item{entries.length !== 1 ? "s" : ""}
                          {enabledFields.length > 0 && " · "}
                          {enabledFields.slice(0, 3).map(f => `${Math.round(totals[f.key] || 0)} ${f.unit}`).join(" / ")}
                        </div>
                      </div>
                      <span style={{ color: "var(--text-muted)", transform: isSelected ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                    </div>
                    {isSelected && (
                      <div style={{ background: "var(--card-bg)", borderRadius: "0 0 12px 12px", padding: "0 16px 14px", borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", padding: "12px 0 8px" }}>
                          {enabledFields.map(f => (
                            <div key={f.key} style={{ fontSize: 13 }}>
                              <span style={{ color: "var(--text-muted)" }}>{f.label}:</span>{" "}
                              <span style={{ fontWeight: 600 }}>{Math.round((totals[f.key] || 0) * 10) / 10}{f.unit}</span>
                            </div>
                          ))}
                        </div>
                        {entries.map(entry => {
                          if (entry.isQuickAdd) {
                            const val = Object.entries(entry.values || {})[0];
                            return (
                              <div key={entry.id} style={{ fontSize: 12, color: "var(--text-muted)", padding: "4px 0", display: "flex", justifyContent: "space-between" }}>
                                <span>{entry.quickLabel} +{val?.[1]}</span>
                                <button onClick={() => removeLogEntry(day, entry.id)} style={{ background: "none", border: "none", color: "#cc3333", cursor: "pointer", fontSize: 11, padding: 0 }}>remove</button>
                              </div>
                            );
                          }
                          const food = foods.find(f => f.id === entry.foodId);
                          return (
                            <div key={entry.id} style={{ fontSize: 12, color: "var(--text-muted)", padding: "4px 0", display: "flex", justifyContent: "space-between" }}>
                              <span>{food ? food.name : "Unknown"} × {entry.servings}</span>
                              <button onClick={() => removeLogEntry(day, entry.id)} style={{ background: "none", border: "none", color: "#cc3333", cursor: "pointer", fontSize: 11, padding: 0 }}>remove</button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ═══ WEIGHT TAB ═══ */}
        {tab === "weight" && <WeightPanel weightLog={weightLog} setWeightLog={setWeightLog} logs={logs} foods={foods} allFields={allFields} />}

        {/* ═══ STATS TAB ═══ */}
        {tab === "stats" && <StatsPanel logs={logs} foods={foods} enabledFields={enabledFields} computeTotals={computeTotals} goals={goals} weightLog={weightLog} allFields={allFields} />}

        {/* ═══ SETTINGS TAB ═══ */}
        {tab === "settings" && (
          <>
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
                foods, logs, fields, customFields, goals, categories, weightLog, bounds,
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
                setFoods([]); setLogs({}); setFields(DEFAULT_FIELDS); setCustomFields([]); setGoals(DEFAULT_GOALS); setCategories(DEFAULT_CATEGORIES); setWeightLog({}); setBounds({});
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
      <AddFoodModal open={showAddFood} onClose={() => { setShowAddFood(false); setEditFood(null); setAddFoodCategory(null); }} onSave={saveFood} editFood={editFood} allFields={allFields} enabledFields={enabledFields} categories={categories} defaultCategory={addFoodCategory} />
      <LogEntryModal open={showLogEntry} onClose={() => setShowLogEntry(false)} foods={foods} enabledFields={enabledFields} onAdd={addLogEntry} categories={categories} />
      <AddFieldModal open={showAddField} onClose={() => setShowAddField(false)} onAdd={addCustomField} />
      <QuickWaterModal open={showQuickWater} onClose={() => setShowQuickWater(false)} onAdd={(amt) => { addQuickEntry("water", amt); setShowQuickWater(false); }} waterUnit={fields.find(f => f.key === "water")?.unit || "oz"} />
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

// ─── Add/Edit Food Modal ─────────────────────────────────────────

function AddFoodModal({ open, onClose, onSave, editFood, allFields, enabledFields, categories, defaultCategory }) {
  const [name, setName] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [servingUnit, setServingUnit] = useState("");
  const [nutrition, setNutrition] = useState({});
  const [category, setCategory] = useState("Other");

  useEffect(() => {
    if (editFood) {
      setName(editFood.name);
      setServingSize(String(editFood.servingSize));
      setServingUnit(editFood.servingUnit);
      setNutrition(editFood.nutrition || {});
      setCategory(editFood.category || "Other");
    } else {
      setName(""); setServingSize(""); setServingUnit(""); setNutrition({});
      setCategory(defaultCategory || "Other");
    }
  }, [editFood, open, defaultCategory]);

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id: editFood ? editFood.id : generateId(),
      name: name.trim(),
      servingSize: parseFloat(servingSize) || 1,
      servingUnit: servingUnit.trim() || "serving",
      nutrition,
      category,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={editFood ? "Edit Food" : "Add Food"}>
      <FieldInput label="Food Name" value={name} onChange={setName} placeholder="e.g. Olive Oil" />
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <FieldInput label="Serving Size" value={servingSize} onChange={setServingSize} type="number" placeholder="1" step="any" />
        <FieldInput label="Serving Unit" value={servingUnit} onChange={setServingUnit} placeholder="tbsp" />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", margin: "8px 0 8px" }}>
        Nutrition per Serving
      </div>
      {enabledFields.map(f => (
        <FieldInput key={f.key} label={f.label} unit={f.unit} type="number" step="any" placeholder="0"
          value={nutrition[f.key] !== undefined ? String(nutrition[f.key]) : ""}
          onChange={v => setNutrition({ ...nutrition, [f.key]: parseFloat(v) || 0 })}
        />
      ))}
      <Btn onClick={handleSave} disabled={!name.trim()} style={{ marginTop: 8 }}>
        {editFood ? "Save Changes" : "Add Food"}
      </Btn>
    </Modal>
  );
}

// ─── Log Entry Modal ─────────────────────────────────────────────

function LogEntryModal({ open, onClose, foods, enabledFields, onAdd, categories }) {
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [servings, setServings] = useState("1");

  useEffect(() => { if (open) { setSearch(""); setSelectedFood(null); setServings("1"); } }, [open]);

  const filtered = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const isSearching = search.trim().length > 0;

  function handleAdd() {
    if (!selectedFood) return;
    onAdd(selectedFood.id, parseFloat(servings) || 1);
    onClose();
  }

  const FoodRow = ({ food }) => (
    <div onClick={() => setSelectedFood(food)} style={{
      padding: "12px 14px", borderRadius: 10, cursor: "pointer", marginBottom: 4,
      background: "var(--input-bg)", transition: "background 0.15s",
    }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{food.name}</div>
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
                {foods.length === 0 ? "Add foods in the Foods tab first" : "No matches found"}
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
            <div style={{ fontSize: 15, fontWeight: 600 }}>{selectedFood.name}</div>
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
          <FieldInput label="Number of Servings" value={servings} onChange={setServings} type="number" placeholder="1" step="any" />
          {parseFloat(servings) > 0 && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>Total:</span>
              {enabledFields.map(f => (
                <span key={f.key}>{f.label}: {Math.round(((selectedFood.nutrition[f.key] || 0) * parseFloat(servings)) * 10) / 10}{f.unit}</span>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Btn variant="secondary" onClick={() => setSelectedFood(null)}>Back</Btn>
            <Btn onClick={handleAdd}>Add</Btn>
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

// ─── Stats Panel ─────────────────────────────────────────────────

function StatsPanel({ logs, foods, enabledFields, computeTotals, goals, weightLog, allFields }) {
  const [range, setRange] = useState("7");
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
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Log at least 14 days of weight and 7 days of food to estimate your maintenance calories.
                </div>
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

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", margin: "20px 0 10px" }}>
            Daily Breakdown
          </div>
          {daysToUse.map((day, di) => {
            const totals = dayTotals[di];
            return (
              <div key={day} style={{ background: "var(--card-bg)", borderRadius: 12, padding: "12px 16px", marginBottom: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{formatDate(day)}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
                  {enabledFields.map(f => (
                    <span key={f.key} style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {f.label}: <span style={{ fontWeight: 600, color: "var(--text)" }}>{Math.round((totals[f.key] || 0) * 10) / 10}</span>{f.unit}
                    </span>
                  ))}
                </div>
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
