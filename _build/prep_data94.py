"""Excel -> data94.json for In Depth #94. Columns are read by header name, never by position.
Usage: python -X utf8 _build/prep_data94.py DATA/Hydrogen_Transport_InDepth_Data.xlsx _build/data94.json
ND / empty ("no defensible figure") becomes null and is never treated as zero. Nothing is estimated.
The English of every label the page shows from the Excel goes to D["xl"] (key -> text): the build publishes it as the catalog keys xl.*,
and es.json holds the Spanish."""
import json, re, sys, openpyxl

xl, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(xl, data_only=True)

def rows(sheet, first_header):
    """Rows of a sheet as dicts keyed by the header row, found by the text of its first cell."""
    allr = list(wb[sheet].iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(allr) if isinstance(r[0], str) and r[0].strip() == first_header)
    head = [h.strip() if isinstance(h, str) else h for h in allr[hi]]
    o = []
    for r in allr[hi + 1:]:
        if r[0] is None: continue
        o.append({h: (None if v in ("ND", "", None) else v) for h, v in zip(head, r) if h})
    return o

D, XL = {}, {}

# ---- V01 · key figures (the page takes the text from the docx table; the Excel is the cross-check) ----
D["kf"] = [{"figure": r["Figure"], "value": r["Value"]} for r in rows("02_Key_Figures", "Figure")]
assert len(D["kf"]) == 6
def lab(key, text):
    assert key not in XL, key
    XL[key] = text
    return key

def src_of(r, col="Source"): return r.get(col)

# ---- V02 · cars ----
cs = rows("03_Car_Sales", "Panel")
def panel(letter): return [r for r in cs if r["Panel"].startswith(letter + ".")]
A = [r for r in panel("A") if r["Label"] != "World total"]
tot = next(r for r in panel("A") if r["Label"] == "World total")
assert [r["Label"] for r in A] == ["China", "South Korea", "Europe", "Japan", "North America"]
assert sum(r["Value"] for r in A) == 15960 and tot["Value"] == 16011        # the Excel note: the five markets add up to 15,960
D["cars"] = {
    "A": [{"id": f"A{i}", "label": lab(f"xl.car.A{i}", r["Label"]), "v": r["Value"], "commercial": r["Label"] == "China"} for i, r in enumerate(A, 1)],
    "world": tot["Value"],
    "B": [], "C": []}
def pct(note):
    m = re.search(r"([+\-−]?\d+(?:\.\d+)?)%", note or ""); return float(m.group(1).replace("−", "-")) if m else None
for i, r in enumerate(panel("B"), 1):
    D["cars"]["B"].append({"id": f"B{i}", "label": lab(f"xl.car.B{i}", r["Label"]), "v": r["Value"], "delta": pct(r["Note"])})
for i, r in enumerate(panel("C"), 1):
    D["cars"]["C"].append({"id": f"C{i}", "label": lab(f"xl.car.C{i}", r["Label"]), "v": r["Value"], "delta": pct(r["Note"]) if i > 1 else None})
assert [d["v"] for d in D["cars"]["B"]] == [6861, 1168, 185] and [d["delta"] for d in D["cars"]["B"]] == [78.9, -39.1, None]
assert [d["v"] for d in D["cars"]["C"]] == [4110, 4643, 3337, 306, 921] and [d["delta"] for d in D["cars"]["C"]] == [None, 13.0, 161.9, -56.7, -54.4]
assert round((4643 / 4110 - 1) * 100) == 13

# ---- V03 · world stations ----
sw = {r["Label"]: r for r in rows("04_Stations_World", "Label")}
blocks = [("Asia-Pacific", "AP"), ("Europe, Middle East and Africa (EMEA)", "EMEA"), ("Americas", "AM")]
D["stw"] = {"blocks": [{"id": k, "label": lab(f"xl.stw.{k}", sw[n]["Value"] and n), "v": sw[n]["Value"]} for n, k in blocks],
            "total": sw["World total"]["Value"], "share5": sw["Share of China, South Korea, Japan, France and Germany"]["Value"]}
assert sum(b["v"] for b in D["stw"]["blocks"]) == D["stw"]["total"] == 1369 and D["stw"]["share5"] == 79
assert round(849 / 1369 * 100) == 62

# ---- V04 · stations by country ----
sc = rows("05_Stations_Countries", "Label")
L = {r["Label"]: r for r in sc}
D["stc"] = {"de_before": L["Germany, two years ago"]["Value"], "de": L["Germany"]["Value"], "jp": L["Japan"]["Value"],
            "ca": L["California, open to the public"]["Value"], "ca_out": L["California, temporarily out of service"]["Value"], "cn": L["China"]["Value"]}
assert D["stc"] == {"de_before": 80, "de": 50, "jp": 149, "ca": 50, "ca_out": 11, "cn": 574}

# ---- V05 · prices ----
pr = {r["Label"]: r for r in rows("06_Prices", "Panel")}
D["prices"] = {
    "de_max": pr["Maximum pump price"]["Value"], "de_truck": pr["hylane truck tariff at H2 Mobility stations"]["Value"],
    "cut5": pr["H2 Mobility cut at 5 stations (1 June)"]["Value"],
    "cut15": [pr["H2 Mobility cut at 15 stations (1 October), minimum"]["Value"], pr["H2 Mobility cut at 15 stations (1 October), maximum"]["Value"]],
    "cn": [pr["Price in pilot cities, minimum"]["Value"], pr["Price in pilot cities, maximum"]["Value"]], "cn_target": pr["Target for 2030 (under)"]["Value"],
    "kg100": [pr["Car, minimum consumption"]["Value"], pr["Car, maximum consumption"]["Value"]],
    "cost100": [pr["Cost per 100 km at the maximum price, minimum"]["Value"], pr["Cost per 100 km at the maximum price, maximum"]["Value"]],
    "doe": [pr["Hydrogen production, 2026"]["Value"], pr["Hydrogen production, 2031"]["Value"],
            pr["Hydrogen dispensed to heavy-duty vehicles, 2028"]["Value"], pr["Fuel cell system for heavy transport, 2030"]["Value"]]}
P = D["prices"]
assert [round(k * P["de_max"], 1) for k in P["kg100"]] == P["cost100"] == [15.2, 17.1]      # the own calculation checks out
assert P["doe"] == [2, 1, 7, 80] and P["cn"] == [35, 76] and P["cn_target"] == 25

# ---- V06 · trucks ----
STATUS = {"Done": "done", "Plan": "plan", "Pending": "pending"}
D["trucks"] = []
for i, r in enumerate(rows("07_Trucks", "Date"), 1):
    D["trucks"].append({"id": f"T{i:02d}", "date": r["Date"], "m": lab(f"xl.tr.T{i:02d}", r["Milestone"]), "status": STATUS[r["Status"]]})
assert len(D["trucks"]) == 14 and [t["status"] for t in D["trucks"]].count("done") == 9
dz = next(t for t in D["trucks"] if "delayed series production" in XL[t["m"]]); dz["flag"] = "postponed"
d100 = next(t for t in D["trucks"] if "100 next-generation trucks" in XL[t["m"]]); d100["flag"] = "plan100"

# ---- V07 · buses ----
bs = rows("08_Buses", "Agency")
D["buses"] = []
for i, r in enumerate(bs, 1):
    if "grant" in r["Agency"]: continue
    D["buses"].append({"id": f"U{i}", "agency": lab(f"xl.bus.U{i}", r["Agency"]), "detail": lab(f"xl.bus.U{i}.d", r["Detail"]),
                       "svc": r["In service"], "plan": r["Approved or planned"]})
gr = next(r for r in bs if "grant" in r["Agency"]); D["grant"] = {"label": lab("xl.bus.grant", gr["Agency"]), "usd_m": gr["In service"]}
assert [b["svc"] for b in D["buses"]] == [10, 13, 3, 2, 2] and [b["plan"] for b in D["buses"]] == [108, None, None, 40, 10] and D["grant"]["usd_m"] == 52.5

# ---- V08 · who leaves, who bets ----
TYPE = {"Exit": "exit", "Insolvency": "exit", "Insolvency (not confirmed)": "exit", "Bet": "bet", "Public aid": "bet"}
D["exits"] = []
for i, r in enumerate(rows("09_Exits_and_Bets", "Date"), 1):
    D["exits"].append({"id": f"E{i:02d}", "date": r["Date"], "co": lab(f"xl.ex.E{i:02d}", r["Company"]), "what": lab(f"xl.ex.E{i:02d}.w", r["What happened"]),
                       "type": r["Type"], "lane": TYPE[r["Type"]], "unconfirmed": "not confirmed" in r["Type"]})
assert len(D["exits"]) == 11 and [e["lane"] for e in D["exits"]].count("exit") == 4 and sum(e["unconfirmed"] for e in D["exits"]) == 1

# ---- V09 · China ----
cnr = {r["Label"]: r for r in rows("10_China", "Label")}
cn = {k: r["Value"] for k, r in cnr.items()}
D["china"] = {"target": cn["Fuel cell vehicle target for 2030"], "sold": cn["Sold in the five pilot city clusters"], "caam": cn["First-half 2026 sales, CAAM count"],
              "sne": cn["First-half 2026 sales, SNE Research count (commercial)"],
              "caam_delta": pct(cnr["First-half 2026 sales, CAAM count"]["Note"]), "sne_delta": pct(cnr["First-half 2026 sales, SNE Research count (commercial)"]["Note"]), "stations": cn["Stations at the end of 2025"],
              "price": [cn["Price in pilot cities, minimum"], cn["Price in pilot cities, maximum"]], "price_target": cn["Price target for 2030 (under)"]}
assert D["china"] == {"target": 100000, "sold": 39023, "caam": 550, "sne": 921, "caam_delta": -63.5, "sne_delta": -54.4, "stations": 574, "price": [35, 76], "price_target": 25}
assert D["stc"]["cn"] == D["china"]["stations"] and D["prices"]["cn"] == D["china"]["price"]      # the same figure on two sheets

D["xl"] = XL
json.dump(D, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
for k, v in D.items(): print(f"{k:8s}", len(v) if isinstance(v, (list, dict)) else v)
