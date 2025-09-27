// Registry: list dashboard widgets here.
// Each widget must be imported and mapped by id.

import ClockWidget from "./ClockWidget.jsx";
import TodoWidget from "./ToDoWidget.jsx";      // <- ensure the file is named exactly TodoWidget.jsx
import OilPriceWidget from "./OilPriceWidget.jsx";
import MapWidget from "./MapWidget.jsx";

import WellsListWidget from "./WellsListWidget.jsx";
import QuickAddWidget from "./QuickAddWidget.jsx";
import RecentRecordsWidget from "./RecentRecordsWidget.jsx";
import StatsWidget from "./StatsWidget.jsx";

// If you already have other widgets, import and add them here too.

export const WIDGETS = [
  { id: "oil",      title: "WTI Oil Price" },
  { id: "map",      title: "Map" },
  { id: "clock",    title: "Date & Time" },
  { id: "todo",     title: "To-Do List" },
  { id: "wells",    title: "Wells (List)" },
  { id: "quickAdd", title: "Quick Add Well" },
  { id: "recent",   title: "Recent Records" },
  { id: "stats",    title: "Stats" },
];

export const WIDGET_MAP = {
  oil:      { title: "WTI Oil Price",  component: OilPriceWidget },
  map:      { title: "Map",            component: MapWidget },
  clock:    { title: "Date & Time",    component: ClockWidget },
  todo:     { title: "To-Do List",     component: TodoWidget },
  wells:    { title: "Wells (List)",   component: WellsListWidget },
  quickAdd: { title: "Quick Add Well", component: QuickAddWidget },
  recent:   { title: "Recent Records", component: RecentRecordsWidget },
  stats:    { title: "Stats",          component: StatsWidget },
};
