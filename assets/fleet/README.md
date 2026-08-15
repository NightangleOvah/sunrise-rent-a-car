# Sunrise Cabs fleet assets

Place the production vehicle photographs in this directory using these exact filenames:

- `magnite.jpg` — Nissan Magnite / Compact SUV
- `yaris-cross.jpg` — Toyota Yaris Cross / Hybrid SUV
- `alto.jpg` — Suzuki Alto / Economy City
- `axio.jpg` — Toyota Axio / Executive Sedan
- `prius.jpg` — Toyota Prius / Hybrid Elite
- `vitz.jpg` — Toyota Vitz / Urban Compact
- `kdh.jpg` — Toyota KDH High Roof / Group Transit Van
- `xpander.jpg` — Mitsubishi Xpander / 7-Seater MPV

`app.js` resolves these paths directly from `/assets/fleet/`. The gallery and 3D showroom also fail gracefully if an image is unavailable, preventing broken-image UI from taking down the page.