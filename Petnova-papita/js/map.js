/* =====================================================
   Pet Nova – js/map.js
   Mapa interactivo de Panamá (Leaflet). No hace falta editarlo:
   los lugares se agregan en js/locations.js.
   ===================================================== */
(function () {
    var canvas = document.getElementById("pmap");
    if (!canvas) return;

    /* ---------- Estilo de cada categoría (editable) ---------- */
    var CATEGORY_STYLES = {
        "Parks & walks":        { color: "#2e9e5b" },
        "Vets":                 { color: "#d6453d" },
        "Restaurants & cafés":  { color: "#e8862a" },
        "Shops & grooming":     { color: "#1fa2c4" },
        "Getaways":             { color: "#8a5fe0" }
    };
    var DEFAULT_STYLE = { color: "#5b2a9e" };
    var PANAMA_BOUNDS = [[7.15, -83.1], [9.75, -77.1]];
    var MAX_BOUNDS = [[6.0, -84.8], [10.8, -75.8]];

    var listEl = document.getElementById("pmap-list"),
        countEl = document.getElementById("pmap-count"),
        chipsEl = document.getElementById("pmap-chips"),
        searchEl = document.getElementById("pmap-search"),
        statusEl = document.getElementById("pmap-status"),
        panel = document.getElementById("pmap-panel"),
        toggle = document.getElementById("pmap-toggle");

    /* ---------- Datos y validación ---------- */
    var all = [];
    (typeof LOCATIONS !== "undefined" ? LOCATIONS : []).forEach(function (loc) {
        var okNum = typeof loc.lat === "number" && typeof loc.lng === "number";
        if (!okNum || loc.lat < 7 || loc.lat > 10 || loc.lng < -83.5 || loc.lng > -77) {
            console.warn("[Pet Nova map] Place skipped (missing or out-of-Panama coordinates):", loc.id);
            return;
        }
        all.push(loc);
    });

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function styleOf(cat) { return CATEGORY_STYLES[cat] || DEFAULT_STYLE; }
    function say(msg) { if (statusEl) statusEl.textContent = msg; }

    /* ---------- Contenido del popup (un solo lugar para editarlo) ---------- */
    function renderPopup(loc) {
        var st = styleOf(loc.category);
        var dest = loc.mapsQuery
            ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(loc.mapsQuery)
            : "https://www.google.com/maps/dir/?api=1&destination=" + loc.lat + "," + loc.lng;
        var h = '<div class="pp">';
        h += '<span class="pp-cat" style="background:' + st.color + '">' + esc(loc.category) + "</span>";
        h += "<h3>" + esc(loc.name) + "</h3>";
        if (loc.address) h += '<p class="pp-addr">' + esc(loc.address) + "</p>";
        if (loc.description) h += "<p>" + esc(loc.description) + "</p>";
        if (loc.offers && loc.offers.length) {
            h += '<ul class="pp-offers">' + loc.offers.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul>";
        }
        if (loc.phone) h += '<p><a href="tel:' + esc(loc.phone.replace(/[^+\d]/g, "")) + '">' + esc(loc.phone) + "</a></p>";
        if (loc.whatsapp) h += '<p><a href="https://wa.me/' + esc(loc.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a></p>';
        if (loc.link) h += '<p><a href="' + esc(loc.link) + '" target="_blank" rel="noopener">Website</a></p>';
        if (loc.approx) h += '<p class="pp-note">Approximate pin: confirm the exact spot and the pet policy before you go.</p>';
        h += '<a class="pp-go" href="' + dest + '" target="_blank" rel="noopener">How to get there</a>';
        return h + "</div>";
    }

    /* ---------- Estado ---------- */
    var state = { cat: "All", q: "" };
    var userPos = null;
    var map = null, markersLayer = null, markers = {}, buttons = {}, activeId = null, userLayer = null;

    function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    function visible() {
        var q = norm(state.q);
        return all.filter(function (l) {
            if (state.cat !== "All" && l.category !== state.cat) return false;
            if (!q) return true;
            return norm([l.name, l.address, l.province, l.category, l.description].join(" ")).indexOf(q) !== -1;
        });
    }
    function haversine(a, b) {
        var R = 6371, rad = Math.PI / 180;
        var dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
        var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    /* ---------- Pines ---------- */
    function pinIcon(color) {
        var svg = '<svg viewBox="0 0 36 46" width="36" height="46" aria-hidden="true">' +
            '<path d="M18 2C9.7 2 3 8.6 3 16.8C3 28 18 44 18 44S33 28 33 16.8C33 8.6 26.3 2 18 2Z" fill="' + color + '" stroke="#fff" stroke-width="2.5"/>' +
            '<circle cx="18" cy="17" r="10" fill="#fff"/>' +
            '<g fill="' + color + '" transform="translate(18 17.5) scale(.62)">' +
            '<ellipse cx="0" cy="4" rx="7" ry="6"/><ellipse cx="-8" cy="-3" rx="2.8" ry="3.8" transform="rotate(-20 -8 -3)"/>' +
            '<ellipse cx="-3" cy="-8" rx="2.8" ry="3.8" transform="rotate(-6 -3 -8)"/><ellipse cx="3" cy="-8" rx="2.8" ry="3.8" transform="rotate(6 3 -8)"/>' +
            '<ellipse cx="8" cy="-3" rx="2.8" ry="3.8" transform="rotate(20 8 -3)"/></g></svg>';
        return L.divIcon({ className: "pet-pin", html: svg, iconSize: [36, 46], iconAnchor: [18, 44], popupAnchor: [0, -38] });
    }

    /* ---------- Lista lateral ---------- */
    function setActive(id, scroll) {
        activeId = id;
        Object.keys(buttons).forEach(function (k) {
            buttons[k].classList.toggle("is-active", k === id);
            buttons[k].setAttribute("aria-pressed", k === id ? "true" : "false");
        });
        if (scroll && buttons[id] && listEl) {
            var wrap = listEl.parentNode, b = buttons[id].getBoundingClientRect(), w = wrap.getBoundingClientRect();
            wrap.scrollTop += (b.top - w.top) - (w.height / 2) + (b.height / 2);
        }
    }
    function choose(id) {
        var loc = all.filter(function (l) { return l.id === id; })[0];
        if (!loc) return;
        setActive(id, false);
        if (map && markers[id]) {
            map.flyTo([loc.lat, loc.lng], 16, { duration: 0.9 });
            map.once("moveend", function () { if (markers[id]) markers[id].openPopup(); });
        }
    }
    function renderList(items) {
        listEl.innerHTML = "";
        buttons = {};
        if (!items.length) {
            var li0 = document.createElement("li");
            li0.className = "pmap-empty"; li0.textContent = "No places match your search. Try another filter.";
            listEl.appendChild(li0); return;
        }
        items.forEach(function (loc) {
            var li = document.createElement("li");
            var b = document.createElement("button");
            b.type = "button"; b.className = "pmap-item"; b.setAttribute("aria-pressed", "false");
            var dot = document.createElement("span"); dot.className = "pmap-dot"; dot.style.background = styleOf(loc.category).color;
            var txt = document.createElement("span"); txt.className = "pmap-item-text";
            var n = document.createElement("strong"); n.textContent = loc.name;
            var s = document.createElement("small");
            var extra = userPos ? " · " + haversine(userPos, [loc.lat, loc.lng]).toFixed(1) + " km away" : "";
            s.textContent = loc.category + extra;
            txt.appendChild(n); txt.appendChild(s);
            b.appendChild(dot); b.appendChild(txt);
            b.addEventListener("click", function () { choose(loc.id); });
            li.appendChild(b); listEl.appendChild(li);
            buttons[loc.id] = b;
        });
        if (activeId && buttons[activeId]) setActive(activeId, false);
    }

    /* ---------- Refrescar todo ---------- */
    function refresh(fit) {
        var items = visible();
        if (userPos) items.sort(function (a, b) { return haversine(userPos, [a.lat, a.lng]) - haversine(userPos, [b.lat, b.lng]); });
        renderList(items);
        countEl.textContent = "Showing " + items.length + " of " + all.length + " places";
        if (map) {
            markersLayer.clearLayers();
            items.forEach(function (loc) {
                var m = markers[loc.id];
                if (!m) {
                    m = L.marker([loc.lat, loc.lng], { icon: pinIcon(styleOf(loc.category).color), title: loc.name, alt: loc.name, keyboard: true });
                    m.bindPopup(renderPopup(loc), { maxWidth: 280 });
                    m.on("click", function () { setActive(loc.id, true); });
                    markers[loc.id] = m;
                }
                markersLayer.addLayer(m);
            });
            if (fit && items.length) {
                var b = L.latLngBounds(items.map(function (l) { return [l.lat, l.lng]; }));
                if (items.length === 1) map.flyTo(b.getCenter(), 15); else map.flyToBounds(b, { padding: [50, 50], maxZoom: 14, duration: 0.8 });
            }
        }
    }

    /* ---------- Chips de categoría (se generan solos) ---------- */
    function buildChips() {
        var cats = ["All"];
        all.forEach(function (l) { if (cats.indexOf(l.category) === -1) cats.push(l.category); });
        chipsEl.innerHTML = "";
        cats.forEach(function (c) {
            var b = document.createElement("button");
            b.type = "button"; b.className = "pmap-chip-btn"; b.setAttribute("aria-pressed", c === state.cat ? "true" : "false");
            if (c !== "All") { var d = document.createElement("span"); d.className = "pmap-dot"; d.style.background = styleOf(c).color; b.appendChild(d); }
            b.appendChild(document.createTextNode(c === "All" ? "All places" : c));
            b.addEventListener("click", function () {
                state.cat = c;
                Array.prototype.forEach.call(chipsEl.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
                refresh(true);
            });
            chipsEl.appendChild(b);
        });
    }

    var typing;
    searchEl.addEventListener("input", function () {
        clearTimeout(typing);
        typing = setTimeout(function () { state.q = searchEl.value; refresh(true); }, 200);
    });

    /* ---------- Botones: Todo Panamá / Ajustar / Cerca de mí ---------- */
    document.getElementById("pmap-all").addEventListener("click", function () {
        state.cat = "All"; state.q = ""; searchEl.value = ""; userPos = null; buildChips(); refresh(false);
        if (map) map.flyToBounds(PANAMA_BOUNDS, { duration: 0.9 });
    });
    document.getElementById("pmap-near").addEventListener("click", function () {
        if (!navigator.geolocation) { say("Your browser can’t share your location."); return; }
        say("Looking for your location…");
        navigator.geolocation.getCurrentPosition(function (pos) {
            userPos = [pos.coords.latitude, pos.coords.longitude];
            if (userPos[0] < 6 || userPos[0] > 11 || userPos[1] < -84.5 || userPos[1] > -76) {
                say("You seem to be outside Panama, so the distances may be very long."); }
            else say("Places are now sorted by distance from you.");
            if (map) {
                if (userLayer) map.removeLayer(userLayer);
                userLayer = L.layerGroup([
                    L.circle(userPos, { radius: pos.coords.accuracy || 50, color: "#5b2a9e", weight: 1, fillOpacity: 0.12 }),
                    L.circleMarker(userPos, { radius: 8, color: "#fff", weight: 3, fillColor: "#5b2a9e", fillOpacity: 1 }).bindTooltip("You are here", { permanent: false })
                ]).addTo(map);
                map.flyTo(userPos, 13, { duration: 0.9 });
            }
            refresh(false);
        }, function (err) {
            say(err && err.code === 1 ? "Location permission was denied. Allow it in your browser to use this." : "We couldn’t get your location. Try again.");
        }, { enableHighAccuracy: true, timeout: 10000 });
    });

    /* ---------- Panel de filtros (esquina) ---------- */
    if (toggle && panel) {
        toggle.addEventListener("click", function () {
            var open = panel.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
        if (window.matchMedia("(min-width: 700px)").matches) { panel.classList.add("is-open"); toggle.setAttribute("aria-expanded", "true"); }
    }

    buildChips();
    refresh(false);

    /* ---------- Mapa (si Leaflet carga) ---------- */
    if (typeof L === "undefined") {
        canvas.innerHTML = '<p class="pmap-offline">The map could not load. Check your internet connection. You can still browse the list of places.</p>';
        return;
    }
    map = L.map(canvas, {
        minZoom: 7, maxZoom: 19, maxBounds: MAX_BOUNDS, maxBoundsViscosity: 0.8,
        scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: true, zoomControl: true
    });
    map.fitBounds(PANAMA_BOUNDS);
    var sat = L.layerGroup([
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 19, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" }),
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 })
    ]);
    sat.addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    refresh(false);

    /* La rueda del mouse hace zoom solo después de hacer clic en el mapa */
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
    document.getElementById("pmap-fit").addEventListener("click", function () {
        var items = visible();
        if (items.length) map.flyToBounds(L.latLngBounds(items.map(function (l) { return [l.lat, l.lng]; })), { padding: [50, 50], maxZoom: 14 });
    });
    setTimeout(function () { map.invalidateSize(); }, 300);

    /* ---------- Modo edición: functions.html?edit=1 ---------- */
    if (/[?&]edit=1/.test(location.search)) {
        var box = document.getElementById("pmap-edit");
        if (!box) return;
        box.hidden = false;
        var temp = null, pos = null;
        var f = box.querySelector("form"), out = box.querySelector("textarea"), info = box.querySelector(".edit-coords");
        var cats = Object.keys(CATEGORY_STYLES);
        f.category.innerHTML = cats.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("");
        map.on("click", function (e) {
            pos = e.latlng;
            if (temp) temp.setLatLng(pos); else temp = L.marker(pos, { opacity: 0.7 }).addTo(map);
            info.textContent = "lat " + pos.lat.toFixed(5) + ", lng " + pos.lng.toFixed(5);
            build();
        });
        function q(s) { return JSON.stringify(s || ""); }
        function build() {
            if (!pos) { out.value = ""; return; }
            var id = (f.name.value || "new-place").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            var offers = f.offers.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
            out.value = "  {\n    id: " + q(id) + ",\n    name: " + q(f.name.value) + ",\n    category: " + q(f.category.value) +
                ",\n    province: " + q(f.province.value) + ",\n    address: " + q(f.address.value) +
                ",\n    lat: " + pos.lat.toFixed(5) + ", lng: " + pos.lng.toFixed(5) +
                ",\n    description: " + q(f.description.value) + ",\n    offers: " + JSON.stringify(offers) + "\n  },";
        }
        f.addEventListener("input", build);
        f.addEventListener("submit", function (e) { e.preventDefault(); });
        box.querySelector(".edit-copy").addEventListener("click", function () {
            out.select();
            try { document.execCommand("copy"); this.textContent = "Copied!"; } catch (e) {}
            var btn = this; setTimeout(function () { btn.textContent = "Copy"; }, 1500);
        });
    }
})();
