/** ISGS (ILOIL) data helpers — ASCII-only **/

// --- Endpoints ---
const WELLS_URL =
  "https://maps.isgs.illinois.edu/arcgis/rest/services/ILOIL/Wells/MapServer/8/query";
const HORIZONS_URL =
  "https://maps.isgs.illinois.edu/arcgis/rest/services/ILOIL/Producing_Horizons2/MapServer/0/query";
const COUNTIES_URL =
  "https://data.isgs.illinois.edu/arcgis/rest/services/Reference/County_Boundaries/MapServer/0/query";
const FIELDS_URL =
  "https://maps.isgs.illinois.edu/arcgis/rest/services/ILOIL/Oil_and_Gas_Fields/MapServer/0/query";

// --- Generic ArcGIS query helper (auto-POST if URL would be long) ---
async function arcgisQuery(url, params) {
  const usp = new URLSearchParams({ f: "json", ...params });
  const qs = usp.toString();
  const usePost = qs.length > 1800 || params.geometry != null; // avoid very long GETs
  const res = await fetch(usePost ? url : `${url}?${qs}`, usePost ? {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: usp,
  } : undefined);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    const msg = json?.error?.message || `ArcGIS error querying ${url}`;
    throw new Error(msg);
  }
  return json;
}

// --- Extent (envelope) lookups for spatial filters ---
export async function fetchCountyExtent(countyName) {
  const name = (countyName || "").trim().toUpperCase().replaceAll("'", "''");
  if (!name) return null;
  const data = await arcgisQuery(COUNTIES_URL, {
    where: `COUNTY_NAME='${name}'`,
    returnExtentOnly: "true",
    outSR: "3857",
  });
  return data.extent || null;
}

export async function fetchFieldExtent(fieldLike) {
  const q = (fieldLike || "").trim().replaceAll("'", "''");
  if (!q) return null;
  const data = await arcgisQuery(FIELDS_URL, {
    where: `FIELD_NAME LIKE '%${q}%'`,
    returnExtentOnly: "true",
    outSR: "3857",
  });
  return data.extent || null;
}

export async function fetchFieldSuggestions(q) {
  const txt = (q || "").trim().replaceAll("'", "''");
  if (!txt) return [];
  const data = await arcgisQuery(FIELDS_URL, {
    where: `FIELD_NAME LIKE '%${txt}%'`,
    outFields: "FIELD_NAME",
    returnGeometry: "false",
    returnDistinctValues: "true",
    orderByFields: "FIELD_NAME",
    resultRecordCount: 10,
  });
  return (data.features || []).map(f => f.attributes.FIELD_NAME).filter(Boolean);
}


// --- Wells query (supports attribute + optional extent) ---
export async function fetchWellsPage({ where = "1=1", limit = 2000, offset = 0, geometry = null } = {}) {
  const params = {
    where,
    outFields: [
      "OBJECTID",
      "API_NUMBER","STATUS","STATUS_TEXT",
      "TOTAL_DEPTH","TDFORMATION","TDFMTEXT",
      "PERMIT_NUMBER","PERMIT_DATE","COMP_DATE",
      "FARM_NAME","FARM_NUM","COMPANY_NAME",
      "LOCATION","LONGITUDE","LATITUDE","ELEVATION"
    ].join(","),
    returnGeometry: "false",
    orderByFields: "API_NUMBER",
    resultRecordCount: String(limit),
    resultOffset: String(offset),
    outSR: "3857",
  };
  if (geometry) {
    params.geometry = JSON.stringify(geometry);            // envelope
    params.geometryType = "esriGeometryEnvelope";
    params.spatialRel = "esriSpatialRelIntersects";
    params.inSR = "3857";
  }
  const data = await arcgisQuery(WELLS_URL, params);
  const features = (data.features || []).map(f => f.attributes || {});
  return { features, exceeded: !!data.exceededTransferLimit };
}

// --- Producing Horizons by API (proxy for perforated zones) ---
export async function fetchPayStratsByAPI(api) {
  if (!api) return [];
  const data = await arcgisQuery(HORIZONS_URL, {
    where: `API_NUMBER='${String(api).replaceAll("'", "''")}'`,
    outFields: "PAYSTRAT,PAYSTRAT_TEXT,FIELDNAME,FIELDsummary",
    returnGeometry: "false",
  });
  return (data.features || []).map(f => f.attributes);
}

// --- Normalize ISGS record -> your app model ---
export function mapIsgsToWell(record, paystrats = []) {
  const api = record.API_NUMBER?.trim();
  return {
    id: api || (crypto?.randomUUID ? crypto.randomUUID() : `well_${Math.random().toString(36).slice(2)}`),
    name: [record.FARM_NAME, record.FARM_NUM].filter(Boolean).join(" "),
    location: record.LOCATION || "",
    county: "",
    company: record.COMPANY_NAME || "",
    info: {
      apiNumber: api || "",
      statusCode: record.STATUS || "",
      statusText: record.STATUS_TEXT || "",
      latitude: record.LATITUDE ?? null,
      longitude: record.LONGITUDE ?? null,
      elevation_ft: record.ELEVATION ?? null,
      td_ft: record.TOTAL_DEPTH ?? null,
      td_formation: record.TDFMTEXT || record.TDFORMATION || "",
    },
    history: {
      permitNumber: record.PERMIT_NUMBER || "",
      permitDate: record.PERMIT_DATE || null,
      completionDate: record.COMP_DATE || null,
      producingHorizons: paystrats.map(p => ({
        code: p.PAYSTRAT || "",
        name: p.PAYSTRAT_TEXT || "",
        field: p.FIELDNAME || "",
      })),
      dataSummary: record.DataSummary || "",
      logsAvailable: record.LOGS || "",
      flags: {
        las: record.FLAG_LAS === "Yes",
        core: record.FLAG_CORE === "Yes",
        coreAnalysis: record.FLAG_CORE_ANALYSIS === "Yes",
        samples: record.FLAG_SAMPLES === "Yes",
        scannedLog: record.FLAG_LOG === "Yes",
      },
    },
    _src: { objectId: record.OBJECTID, updated: Date.now() },
  };
}
