#!/usr/bin/env python3
# ============================================================
# ColoColo Football Center — Descarga de acciones por jugador
# Método curl_cffi: se hace pasar por Chrome real (huella TLS),
# toma cookies visitando la portada y pide la API directamente.
# Con rotación de huella + backoff si aparece un 403/429.
#
# Instalación (una sola vez):
#   python3.11 -m pip install curl_cffi
#
# Uso (desde la carpeta ColoColo):
#   python3.11 scripts/update_player_actions.py                → 3 partidos por corrida
#   python3.11 scripts/update_player_actions.py --match 1      → solo la fecha 1
#   python3.11 scripts/update_player_actions.py --url "https://www.sofascore.com/...#id:15353054"
#   python3.11 scripts/update_player_actions.py --batch 1 --sleep 15
#
# Escribe app/cc-actions-data.js (el formato que lee la plataforma),
# guarda tras cada partido y retoma solo lo pendiente.
# ============================================================
import argparse, json, os, random, re, sys, time, unicodedata

try:
    from curl_cffi import requests as creq
except ImportError:
    sys.exit("Falta curl_cffi. Instala con: python3.11 -m pip install curl_cffi")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'app', 'cc-actions-data.js')
LINEUPS_JS = os.path.join(ROOT, 'app', 'cc-lineups-data.js')


# ---------------- Cliente SofaScore (curl_cffi) ----------------
class SofaError(Exception):
    pass


class SofaScore:
    BASE = "https://www.sofascore.com/"
    IMPERSONATES = ["chrome", "chrome131", "chrome124", "safari"]

    def __init__(self):
        self._imp_idx = 0
        self.session = creq.Session(impersonate=self.IMPERSONATES[0])
        self._warm = False

    def _new_session(self):
        # rota el fingerprint al reintentar tras un 403
        self._imp_idx = (self._imp_idx + 1) % len(self.IMPERSONATES)
        self.session = creq.Session(impersonate=self.IMPERSONATES[self._imp_idx])
        self._warm = False

    def _warmup(self):
        if self._warm:
            return
        # visitar la home crea las cookies de sesión que exige la API
        self.session.get(self.BASE, timeout=25)
        self._warm = True
        time.sleep(random.uniform(0.6, 1.4))

    def get_json(self, path, referer=None, tries=5):
        last = None
        for i in range(tries):
            try:
                self._warmup()
                headers = {"Accept": "*/*"}
                if referer:
                    headers["Referer"] = referer
                r = self.session.get(self.BASE + path, headers=headers, timeout=25)
                if r.status_code == 200:
                    return r.json()
                last = "HTTP %s" % r.status_code
                if r.status_code in (403, 429):   # posible bloqueo
                    self._new_session()           # rota fingerprint
            except Exception as e:
                last = str(e)
                self._new_session()
            time.sleep(2 + i * 2.5 + random.uniform(0, 1.5))  # backoff
        raise SofaError(last or "sin respuesta")

    def get_player_ids(self, event_id, referer=None):
        data = self.get_json("api/v1/event/%s/lineups" % event_id, referer=referer)
        ids = {}
        for side in ("home", "away"):
            for it in (data.get(side) or {}).get("players", []) or []:
                pl = it.get("player") or {}
                if pl.get("name") and pl.get("id") is not None:
                    ids[pl["name"]] = pl["id"]
        if not ids:
            raise SofaError("lineups sin jugadores")
        return ids

    def get_rating_breakdown(self, event_id, player_id, referer=None):
        return self.get_json(
            "api/v1/event/%s/player/%s/rating-breakdown" % (event_id, player_id),
            referer=referer,
        )


# ---------------- Emparejar nombre → id de SofaScore ----------------
def _norm(s):
    s = unicodedata.normalize("NFD", str(s).lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s).strip()


def match_player_id(nombre, ids):
    if nombre in ids:
        return ids[nombre]
    nn = _norm(nombre)
    norm_ids = {_norm(k): v for k, v in ids.items()}
    if nn in norm_ids:
        return norm_ids[nn]
    parts = nn.split()          # apellido (si es único)
    if parts:
        apellido = parts[-1]
        cands = [v for k, v in norm_ids.items() if k.split() and k.split()[-1] == apellido]
        if len(cands) == 1:
            return cands[0]
    return None


# ---------------- Partidos y planteles desde cc-lineups-data.js ----------------
def _des_js(s):
    return s.replace("\\'", "'").replace('\\"', '"')


def _jugadores_de(bloque):
    out = []
    for m in re.finditer(r"\{\s*n:\s*'((?:[^'\\]|\\.)*)',\s*p:\s*'((?:[^'\\]|\\.)*)'(?:,\s*min:\s*(\d+))?", bloque):
        out.append({
            "nombre": _des_js(m.group(1)),
            "posicion": _des_js(m.group(2)),
            "minutos": int(m.group(3)) if m.group(3) else None,
        })
    return out


def partidos_conocidos():
    txt = open(LINEUPS_JS, encoding="utf-8").read()
    marcas = list(re.finditer(r'"(\d+)":\s*\{\s*eventId:\s*(\d+),\s*ccEs:\s*[\'"](home|away)[\'"]', txt))
    partidos = []
    for i, m in enumerate(marcas):
        fin = marcas[i + 1].start() if i + 1 < len(marcas) else len(txt)
        bloque = txt[m.start():fin]
        i_cc = bloque.find("cc: [")
        i_rv = bloque.find("rv: [")
        cc = _jugadores_de(bloque[i_cc:i_rv]) if i_cc >= 0 and i_rv > i_cc else []
        rv = _jugadores_de(bloque[i_rv:]) if i_rv >= 0 else []
        partidos.append({"j": int(m.group(1)), "eventId": int(m.group(2)),
                         "homeEsCC": m.group(3) == "home", "cc": cc, "rv": rv})
    return sorted(partidos, key=lambda x: x["j"])


# ---------------- Bundle de salida ----------------
def cargar_bundle():
    try:
        txt = open(OUT, encoding="utf-8").read()
    except FileNotFoundError:
        return {}
    i = txt.find("CC_ACTIONS_BUNDLE")
    i = txt.find("{", i)
    j = txt.rfind("}")
    if i < 0 or j <= i:
        return {}
    try:
        data = json.loads(txt[i:j + 1])
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def guardar_bundle(bundle):
    cuerpo = json.dumps(bundle, ensure_ascii=False, separators=(",", ":"))
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// Datos reales de acciones por jugador.\n")
        f.write("// Regenerar con: python3.11 scripts/update_player_actions.py\n")
        f.write("// El script conserva datos existentes si una consulta falla.\n")
        f.write("window.CC_ACTIONS_BUNDLE = %s;\n" % cuerpo)


# ---------------- Compactar eventos ----------------
def _num(v):
    if isinstance(v, bool) or v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return round(f, 2)


def eventos_compactos(data):
    eventos = []
    if not isinstance(data, dict):
        return eventos
    for categoria, lista in data.items():
        if not isinstance(lista, list) or re.search("shot", categoria, re.I):
            continue  # los remates ya vienen del shotmap real
        for raw in lista:
            if not isinstance(raw, dict):
                continue
            ini = raw.get("playerCoordinates") or {}
            fin = raw.get("passEndCoordinates") or {}
            x = _num(ini.get("x", raw.get("x")))
            y = _num(ini.get("y", raw.get("y")))
            if x is None or y is None:
                continue
            eventos.append({
                "c": categoria,
                "a": raw.get("eventActionType") or raw.get("actionType") or "",
                "o": raw.get("outcome"),
                "l": raw.get("isLongBall"),
                "i": raw.get("isAssist"),
                "x": x, "y": y,
                "ex": _num(fin.get("x", raw.get("end_x"))),
                "ey": _num(fin.get("y", raw.get("end_y"))),
                "t": raw.get("time", raw.get("minute")),
            })
    return eventos


def compact_avg(data, home_es_cc):
    def lado(arr):
        out = []
        for it in arr or []:
            pl = (it or {}).get("player") or {}
            if pl.get("id") is None or not pl.get("name"):
                continue
            try:
                x = round(float(it.get("averageX")), 1)
                y = round(float(it.get("averageY")), 1)
            except (TypeError, ValueError):
                continue
            out.append({"i": pl["id"], "n": pl["name"], "d": pl.get("jerseyNumber") or it.get("jerseyNumber") or "",
                        "x": x, "y": y, "c": it.get("pointsCount") or 0, "s": bool(it.get("isSubstitute"))})
        return out
    home = lado((data or {}).get("home"))
    away = lado((data or {}).get("away"))
    return {"cc": home, "rv": away} if home_es_cc else {"cc": away, "rv": home}


def esta_completo(item, jugados):
    if not item or not (item.get("cc") or item.get("rv")):
        return False
    acciones = item.get("actions") or {}
    if not item.get("avgPos"):
        return False
    return bool(jugados) and all(isinstance(acciones.get(str(p["id"])), list) for p in jugados)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", type=int, default=3, help="partidos por corrida (defecto 3)")
    ap.add_argument("--sleep", type=float, default=8, help="segundos entre partidos")
    ap.add_argument("--player-delay", type=float, default=2.0, help="segundos entre jugadores")
    ap.add_argument("--match", type=str, default="", help="solo estas jornadas, ej: 1,2,3")
    ap.add_argument("--url", type=str, default="", help="link de SofaScore de UN partido (…#id:15353054)")
    ap.add_argument("--all", action="store_true", help="reprocesa incluso lo ya completo")
    args = ap.parse_args()

    partidos = partidos_conocidos()
    if args.url:
        m = re.search(r"id:(\d+)", args.url)
        if not m:
            sys.exit("El link no trae el id (…#id:15353054).")
        partidos = [p for p in partidos if p["eventId"] == int(m.group(1))]
        if not partidos:
            sys.exit("Ese partido aún no está en app/cc-lineups-data.js — carga primero su alineación en la plataforma.")
    if args.match:
        pedidas = {x.strip() for x in args.match.split(",") if x.strip()}
        partidos = [p for p in partidos if str(p["j"]) in pedidas]
    if not partidos:
        sys.exit("No hay partidos que procesar (revisa app/cc-lineups-data.js).")

    bundle = cargar_bundle()

    # ids internos estables por partido: eventId*100 + índice (cc primero, luego rv)
    def con_ids(p):
        out = []
        for k, base in enumerate(p["cc"] + p["rv"]):
            out.append({
                "id": p["eventId"] * 100 + k,
                "nombre": base["nombre"],
                "posicion": base["posicion"],
                "dorsal": "",
                "minutos": base["minutos"],
                "titular": (base["minutos"] or 0) >= 45,
                "lado": "cc" if k < len(p["cc"]) else "rv",
            })
        return out

    pendientes = []
    for p in partidos:
        jugados = [j for j in con_ids(p) if (j["minutos"] or 0) > 0]
        if args.all or not esta_completo(bundle.get(str(p["eventId"])), jugados):
            pendientes.append(p)
    if not pendientes:
        print("Sin pendientes: la base de acciones ya tiene los partidos solicitados.")
        return
    lote = pendientes[: args.batch]
    print("Procesando %d/%d partido(s) · lote %d" % (len(lote), len(partidos), args.batch))

    sofascore = SofaScore()
    for idx, p in enumerate(lote):
        clave = str(p["eventId"])
        referer = args.url or ("https://www.sofascore.com/football/match/partido#id:%d" % p["eventId"])
        previo = bundle.get(clave) or {}
        jugadores = con_ids(p)
        item = {
            "j": p["j"], "eventId": p["eventId"], "homeEsCC": p["homeEsCC"],
            "cc": [j for j in jugadores if j["lado"] == "cc"],
            "rv": [j for j in jugadores if j["lado"] == "rv"],
            "actions": dict(previo.get("actions") or {}),
            "avgPos": previo.get("avgPos"),
            "errors": {},
            "updatedAt": previo.get("updatedAt"),
        }
        try:
            # 1) mapa nombre → id real de SofaScore (una vez por partido)
            sofa_ids = sofascore.get_player_ids(p["eventId"], referer=referer)
            if not item.get("avgPos"):
                try:
                    ap = sofascore.get_json("api/v1/event/%s/average-positions" % p["eventId"], referer=referer)
                    item["avgPos"] = compact_avg(ap, p["homeEsCC"])
                except Exception as e:
                    item["errors"]["_avgpos"] = "posiciones: %s" % e
            ok = fallos = 0
            # 2) eventos de cada jugador que jugó
            for j in jugadores:
                if (j["minutos"] or 0) <= 0:
                    continue
                pid = str(j["id"])
                if not args.all and isinstance(item["actions"].get(pid), list):
                    continue
                sofa_pid = match_player_id(j["nombre"], sofa_ids)
                if sofa_pid is None:
                    item["errors"][pid] = j["nombre"] + ": sin id en lineups"
                    fallos += 1
                    continue
                try:
                    raw = sofascore.get_rating_breakdown(p["eventId"], sofa_pid, referer=referer)
                    item["actions"][pid] = eventos_compactos(raw)
                    ok += 1
                except Exception as e:
                    if "HTTP 404" in str(e):
                        item["actions"][pid] = []
                        ok += 1
                        continue
                    item["errors"][pid] = "%s: %s" % (j["nombre"], e)
                    fallos += 1
                time.sleep(args.player_delay + random.uniform(0, 0.6))  # pausa = no re-banear
            item["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S")
            bundle[clave] = item
            guardar_bundle(bundle)
            con_ev = sum(1 for a in item["actions"].values() if isinstance(a, list) and a)
            print("F%d (%d): %d jugadores · %d con eventos (%d nuevos, %d fallos)"
                  % (p["j"], p["eventId"], len(jugadores), con_ev, ok, fallos))
        except Exception as e:
            if item["cc"] or item["rv"] or any(item["actions"].values()):
                item["errors"]["_match"] = str(e)
                bundle[clave] = item
                guardar_bundle(bundle)
            print("F%d (%d): pendiente · %s" % (p["j"], p["eventId"], e))

        if idx < len(lote) - 1:
            time.sleep(args.sleep + random.uniform(0, 2))

    print("Listo. Corre de nuevo para continuar con los pendientes.")


if __name__ == "__main__":
    main()
