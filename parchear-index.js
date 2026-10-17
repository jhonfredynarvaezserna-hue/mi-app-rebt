// Uso: poner este archivo en la carpeta del proyecto (junto a index.html) y ejecutar:
//   node parchear-index.js
// Hace copia de seguridad (index.html.bak) y aplica los cambios.

const fs = require("fs");

const archivos = ["index.html", "www/index.html"];

const cambios = [
  {
    nombre: "Permitir zoom en móvil",
    buscar: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
    poner: 'width=device-width, initial-scale=1.0'
  },
  {
    nombre: "Descripción para Google",
    // solo se aplica si todavía no existe una descripción
    comprobarAusente: 'name="description"',
    buscar: '</title>',
    poner: '</title>\n    <meta name="description" content="J.F Clima & Electricidad: urgencias eléctricas y de climatización 24/7, REBT, RITE, domótica KNX y solar en Alicante.">'
  },
  {
    nombre: "Desplegable de caída de tensión (ITC-BT-15)",
    buscar: '<option value="1.5">1,5% (Derivación Individual Centralizada)</option>',
    poner:
      '<option value="1.5">1,5% (Derivación individual, un solo usuario)</option>\n' +
      '                                <option value="1">1% (Derivación individual, contadores centralizados)</option>'
  }
];

for (const ruta of archivos) {
  if (!fs.existsSync(ruta)) {
    console.log("\n(no existe " + ruta + ", se omite)");
    continue;
  }
  console.log("\n== " + ruta + " ==");
  let texto = fs.readFileSync(ruta, "utf8");
  fs.writeFileSync(ruta + ".bak", texto);

  for (const c of cambios) {
    if (c.comprobarAusente && texto.includes(c.comprobarAusente)) {
      console.log("  [ya estaba] " + c.nombre);
      continue;
    }
    if (!texto.includes(c.buscar)) {
      console.log("  [NO ENCONTRADO] " + c.nombre + " (puede que ya esté cambiado)");
      continue;
    }
    texto = texto.replace(c.buscar, c.poner);
    console.log("  [OK] " + c.nombre);
  }

  fs.writeFileSync(ruta, texto);
}

console.log("\nListo. Copias de seguridad guardadas como index.html.bak");