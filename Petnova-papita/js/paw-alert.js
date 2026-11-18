/* =====================================================
   Pet Nova – js/paw-alert.js
   Mapa "Paw Alert": mascotas perdidas / encontradas (Leaflet).
   Las alertas y fotos se guardan en este dispositivo (localStorage).
   ===================================================== */
(function () {
    var canvas = document.getElementById("pa-map");
    if (!canvas) return;

    var KEY = "petnova-pawalert-v1";
    var STATUS_COLORS = { Lost: "#e5484d", Found: "#2e9e5b" };
    var PANAMA_BOUNDS = [[7.15, -83.1], [9.75, -77.1]];
    var MAX_BOUNDS = [[6.0, -84.8], [10.8, -75.8]];

    var listEl = document.getElementById("pa-list"),
        countEl = document.getElementById("pa-count"),
        chipsEl = document.getElementById("pa-chips"),
        searchEl = document.getElementById("pa-search"),
        statusEl = document.getElementById("pa-status"),
        panel = document.getElementById("pa-panel"),
        toggle = document.getElementById("pa-toggle"),
        form = document.getElementById("pa-form"),
        whereEl = document.getElementById("pa-where"),
        formStatus = document.getElementById("pa-form-status"),
        photoIn = document.getElementById("pa-photo"),
        prevBox = document.getElementById("pa-preview"),
        prevImg = document.getElementById("pa-preview-img");

    /* ---------- Ejemplos iniciales (se pueden borrar) ---------- */
    var SEED = [
        { id: "demo-luna", status: "Lost", name: "Luna", species: "Cat", lat: 8.8800, lng: -79.7833,
          desc: "Example alert: small grey cat with a blue collar, last seen near the park.", contact: "6000-0000", date: "", photo: "", demo: true },
        { id: "demo-rocky", status: "Found", name: "Unknown", species: "Dog", lat: 8.9824, lng: -79.5199,
          desc: "Example alert: friendly brown dog found wandering, no collar.", contact: "6000-0001", date: "", photo: "", demo: true }
    ];

    /* ---------- Almacenamiento ---------- */
    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            if (raw === null) return SEED.slice();
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : SEED.slice();
        } catch (e) { return SEED.slice(); }
    }
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(reports)); return true; }
        catch (e) { return false; }
    }
    var reports = load();

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    function say(msg) { if (statusEl) statusEl.textContent = msg; }
    function safePhoto(p) { return typeof p === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(p) ? p : ""; }
    function colorOf(st) { return STATUS_COLORS[st] || "#5b2a9e"; }
    function prettyDate(d) {
        if (!d) return "";
        var p = d.split("-"); if (p.length !== 3) return "";
        return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    function haversine(a, b) {
        var R = 6371, rad = Math.PI / 180;
        var dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
        var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    /* ---------- Estado ---------- */
    var state = { status: "All", q: "" };
    var userPos = null, map = null, layer = null, markers = {}, buttons = {}, activeId = null, userLayer = null;
    var picked = null, pickMarker = null, photoData = "";

    function visible() {
        var q = norm(state.q);
        return reports.filter(function (r) {
            if (state.status !== "All" && r.status !== state.status) return false;
            if (!q) return true;
            return norm([r.name, r.species, r.desc, r.status].join(" ")).indexOf(q) !== -1;
        });
    }

    /* ---------- Pines y popup ---------- */
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
    function popupHtml(r) {
        var ph = safePhoto(r.photo);
        var h = '<div class="pp">';
        h += '<span class="pp-status" style="background:' + colorOf(r.status) + '">' + (r.status === "Lost" ? "Lost" : "Found") + "</span> ";
        h += '<span class="pp-cat" style="background:#5b2a9e">' + esc(r.species) + "</span>";
        h += "<h3>" + esc(r.name || "Unknown") + "</h3>";
        if (ph) h += '<img class="pp-photo" src="' + ph + '" alt="Photo of ' + esc(r.name || "the pet") + '">';
        if (r.date) h += '<p class="pp-addr">Seen on ' + esc(prettyDate(r.date)) + "</p>";
        if (r.desc) h += "<p>" + esc(r.desc) + "</p>";
        if (r.contact) h += '<p><a href="tel:' + esc(String(r.contact).replace(/[^+\d]/g, "")) + '">Call ' + esc(r.contact) + "</a></p>";
        if (r.demo) h += '<p class="pp-note">Example alert: delete it whenever you want.</p>';
        h += '<a class="pp-go" href="https://www.google.com/maps/dir/?api=1&destination=' + r.lat + "," + r.lng + '" target="_blank" rel="noopener">How to get there</a>';
        h += '<button type="button" class="pp-del" data-del="' + esc(r.id) + '">Delete</button>';
        return h + "</div>";
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
        var r = reports.filter(function (x) { return x.id === id; })[0];
        if (!r) return;
        setActive(id, false);
        if (map && markers[id]) {
            map.flyTo([r.lat, r.lng], 16, { duration: 0.9 });
            map.once("moveend", function () { if (markers[id]) markers[id].openPopup(); });
        }
    }
    function renderList(items) {
        listEl.innerHTML = "";
        buttons = {};
        if (!items.length) {
            var li0 = document.createElement("li");
            li0.className = "pmap-empty"; li0.textContent = "No alerts yet. Click the map and publish the first one.";
            listEl.appendChild(li0); return;
        }
        items.forEach(function (r) {
            var li = document.createElement("li"), b = document.createElement("button");
            b.type = "button"; b.className = "pmap-item"; b.setAttribute("aria-pressed", "false");
            var ph = safePhoto(r.photo), th;
            if (ph) { th = document.createElement("img"); th.className = "pa-thumb"; th.src = ph; th.alt = ""; }
            else { th = document.createElement("span"); th.className = "pa-thumb pa-thumb--paw"; th.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#cal-paw"/></svg>'; }
            var txt = document.createElement("span"); txt.className = "pmap-item-text";
            var n = document.createElement("strong"); n.textContent = (r.status === "Lost" ? "Lost: " : "Found: ") + (r.name || "Unknown");
            var s = document.createElement("small");
            s.textContent = r.species + (r.date ? " · " + prettyDate(r.date) : "") + (userPos ? " · " + haversine(userPos, [r.lat, r.lng]).toFixed(1) + " km away" : "");
            txt.appendChild(n); txt.appendChild(s);
            b.appendChild(th); b.appendChild(txt);
            b.style.borderLeft = "6px solid " + colorOf(r.status);
            b.addEventListener("click", function () { choose(r.id); });
            li.appendChild(b); listEl.appendChild(li);
            buttons[r.id] = b;
        });
        if (activeId && buttons[activeId]) setActive(activeId, false);
    }

    function refresh(fit) {
        var items = visible();
        if (userPos) items.sort(function (a, b) { return haversine(userPos, [a.lat, a.lng]) - haversine(userPos, [b.lat, b.lng]); });
        renderList(items);
        countEl.textContent = "Showing " + items.length + " of " + reports.length + " alerts";
        if (map) {
            layer.clearLayers();
            markers = {};
            items.forEach(function (r) {
                var m = L.marker([r.lat, r.lng], { icon: pinIcon(colorOf(r.status)), title: (r.name || "Pet") + " (" + r.status + ")", alt: (r.name || "Pet") + " (" + r.status + ")", keyboard: true });
                m.bindPopup(popupHtml(r), { maxWidth: 260 });
                m.on("click", function () { setActive(r.id, true); });
                markers[r.id] = m;
                layer.addLayer(m);
            });
            if (fit && items.length) {
                var b = L.latLngBounds(items.map(function (l) { return [l.lat, l.lng]; }));
                if (items.length === 1) map.flyTo(b.getCenter(), 15); else map.flyToBounds(b, { padding: [50, 50], maxZoom: 14, duration: 0.8 });
            }
        }
    }

    /* ---------- Chips de estado ---------- */
    function buildChips() {
        var opts = [["All", "All alerts"], ["Lost", "Lost"], ["Found", "Found"]];
        chipsEl.innerHTML = "";
        opts.forEach(function (o) {
            var b = document.createElement("button");
            b.type = "button"; b.className = "pmap-chip-btn"; b.setAttribute("aria-pressed", o[0] === state.status ? "true" : "false");
            if (o[0] !== "All") { var d = document.createElement("span"); d.className = "pmap-dot"; d.style.background = colorOf(o[0]); b.appendChild(d); }
            b.appendChild(document.createTextNode(o[1]));
            b.addEventListener("click", function () {
                state.status = o[0];
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

    function locate(cb) {
        if (!navigator.geolocation) { say("Your browser can’t share your location."); return; }
        say("Looking for your location…");
        navigator.geolocation.getCurrentPosition(function (pos) {
            cb([pos.coords.latitude, pos.coords.longitude], pos.coords.accuracy);
        }, function (err) {
            say(err && err.code === 1 ? "Location permission was denied. Allow it in your browser to use this." : "We couldn’t get your location. Try again.");
        }, { enableHighAccuracy: true, timeout: 10000 });
    }
    document.getElementById("pa-all").addEventListener("click", function () {
        state.status = "All"; state.q = ""; searchEl.value = ""; userPos = null; buildChips(); refresh(false);
        if (map) map.flyToBounds(PANAMA_BOUNDS, { duration: 0.9 });
    });
    document.getElementById("pa-near").addEventListener("click", function () {
        locate(function (pos, acc) {
            userPos = pos;
            if (pos[0] < 6 || pos[0] > 11 || pos[1] < -84.5 || pos[1] > -76) say("You seem to be outside Panama, so the distances may be very long.");
            else say("Alerts are now sorted by distance from you.");
            if (map) {
                if (userLayer) map.removeLayer(userLayer);
                userLayer = L.layerGroup([
                    L.circle(pos, { radius: acc || 50, color: "#5b2a9e", weight: 1, fillOpacity: 0.12 }),
                    L.circleMarker(pos, { radius: 8, color: "#fff", weight: 3, fillColor: "#5b2a9e", fillOpacity: 1 }).bindTooltip("You are here")
                ]).addTo(map);
                map.flyTo(pos, 13, { duration: 0.9 });
            }
            refresh(false);
        });
    });
    if (toggle && panel) {
        toggle.addEventListener("click", function () {
            var open = panel.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
        if (window.matchMedia("(min-width: 700px)").matches) { panel.classList.add("is-open"); toggle.setAttribute("aria-expanded", "true"); }
    }

    /* ---------- Formulario: ubicación, foto y envío ---------- */
    function setPicked(latlng) {
        if (latlng.lat < 7 || latlng.lat > 10 || latlng.lng < -83.5 || latlng.lng > -77) {
            formMsg("That spot is outside Panama. Choose a place inside the country.", true); return;
        }
        picked = [latlng.lat, latlng.lng];
        if (map) {
            if (pickMarker) pickMarker.setLatLng(latlng);
            else pickMarker = L.marker(latlng, { opacity: 0.75, draggable: true, title: "Drag to adjust" }).addTo(map).on("dragend", function () { var p = pickMarker.getLatLng(); picked = [p.lat, p.lng]; });
        }
        whereEl.textContent = "Location chosen. You can drag the pin to adjust it, then fill in the form.";
        whereEl.classList.add("is-set");
    }
    function formMsg(msg, isErr) {
        formStatus.textContent = msg;
        formStatus.classList.toggle("is-error", !!isErr);
    }
    function clearPhoto() { photoData = ""; photoIn.value = ""; prevBox.hidden = true; prevImg.removeAttribute("src"); }
    document.getElementById("pa-preview-clear").addEventListener("click", clearPhoto);

    /* Reduce la foto (máx. 800 px, JPEG) para que quepa en el almacenamiento */
    photoIn.addEventListener("change", function () {
        var f = photoIn.files && photoIn.files[0];
        if (!f) { clearPhoto(); return; }
        if (!/^image\//.test(f.type)) { formMsg("Please choose an image file.", true); clearPhoto(); return; }
        if (f.size > 15 * 1024 * 1024) { formMsg("That photo is too big. Choose one under 15 MB.", true); clearPhoto(); return; }
        var url = URL.createObjectURL(f), img = new Image();
        img.onload = function () {
            var max = 800, k = Math.min(1, max / Math.max(img.width, img.height));
            var c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
            photoData = c.toDataURL("image/jpeg", 0.78);
            URL.revokeObjectURL(url);
            prevImg.src = photoData; prevBox.hidden = false; formMsg("", false);
        };
        img.onerror = function () { URL.revokeObjectURL(url); formMsg("We couldn’t read that photo. Try another one.", true); clearPhoto(); };
        img.src = url;
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!picked) { formMsg("Click the map first to mark where the pet was seen.", true); return; }
        var contact = form.contact.value.trim();
        if (!contact) { formMsg("Add a contact phone so people can reach you.", true); form.contact.focus(); return; }
        var r = {
            id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            status: form.status.value === "Found" ? "Found" : "Lost",
            name: form.name.value.trim() || "Unknown",
            species: form.species.value,
            lat: picked[0], lng: picked[1],
            desc: form.desc.value.trim(), contact: contact, date: form.date.value || "", photo: photoData
        };
        reports.unshift(r);
        if (!save()) {
            if (r.photo) { r.photo = ""; if (save()) { formMsg("Alert saved, but the photo was too big to store on this device.", false); } else { reports.shift(); formMsg("We couldn’t save the alert on this device.", true); return; } }
            else { reports.shift(); formMsg("We couldn’t save the alert on this device.", true); return; }
        } else { formMsg("Alert published! It now appears on the map.", false); }
        form.reset(); clearPhoto();
        picked = null; if (pickMarker && map) { map.removeLayer(pickMarker); pickMarker = null; }
        whereEl.textContent = "Step 1: click the map where the pet was last seen.";
        whereEl.classList.remove("is-set");
        state.status = "All"; state.q = ""; searchEl.value = ""; buildChips();
        refresh(false);
        if (map) { map.flyTo([r.lat, r.lng], 15, { duration: 0.9 }); map.once("moveend", function () { if (markers[r.id]) markers[r.id].openPopup(); }); setActive(r.id, true); }
    });

    buildChips();
    refresh(false);

    /* ---------- Mapa (si Leaflet carga) ---------- */
    if (typeof L === "undefined") {
        canvas.innerHTML = '<p class="pmap-offline">The map could not load. Check your internet connection. You can still browse the list of alerts.</p>';
        return;
    }
    map = L.map(canvas, {
        minZoom: 7, maxZoom: 19, maxBounds: MAX_BOUNDS, maxBoundsViscosity: 0.8,
        scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: true, zoomControl: true
    });
    map.fitBounds(PANAMA_BOUNDS);
    var sat = L.layerGroup([
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" }),
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 })
    ]);
    sat.addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    layer = L.layerGroup().addTo(map);
    refresh(false);

    map.on("click", function (e) { map.scrollWheelZoom.enable(); setPicked(e.latlng); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
    document.getElementById("pa-fit").addEventListener("click", function () {
        var items = visible();
        if (items.length) map.flyToBounds(L.latLngBounds(items.map(function (l) { return [l.lat, l.lng]; })), { padding: [50, 50], maxZoom: 14 });
    });

    /* Borrar una alerta desde su popup */
    canvas.addEventListener("click", function (e) {
        var t = e.target;
        if (!t || !t.getAttribute) return;
        var id = t.getAttribute("data-del");
        if (!id) return;
        reports = reports.filter(function (r) { return r.id !== id; });
        save(); map.closePopup(); activeId = null; refresh(false);
    });

    setTimeout(function () { map.invalidateSize(); }, 300);
})();
