# Filtros de `GET /products` — cambios para el Front

> Cambios recientes en los filtros del catálogo. Verificado contra el server corriendo con datos reales.
> Recordá: el mensaje de error siempre está en `error.response.data.error.message` (string o array).

---

## 1. 🔧 Categoría: ahora se filtra por NOMBRE, no por UUID

**Antes:** `?categoryId=<uuid>`. **Ahora:** `?category_name=<nombre>`.

Como el producto ya devuelve `category_name`, el front usa ese mismo valor directo (sin resolver el UUID).

- Match **exacto, case-insensitive**. Ej: `?category_name=Laptops` o `?category_name=laptops`.
- Con espacios: URL-encode → `?category_name=Custom%20Builds`.
- ⚠️ El viejo `?categoryId=` **ya no existe** → mandarlo da **400** (`property categoryId should not exist`).

Nombres válidos actuales: `pc-parts`, `Laptops`, `Keyboards`, `Monitors`, `Mouses`, `Accessories`,
`Desktop-pcs`, `tablets-y-pads`, `Networking`, `Custom Builds`, `Netbooks`, `Printers`.

---

## 2. 🆕 Filtro `switch` (switches de teclados mecánicos)

Nuevo filtro parcial, case-insensitive. Ej: `?switch=Cherry` → teclados con switches Cherry MX.

Valores reales de ejemplo: `Cherry MX Red`, `Cherry MX Brown`, `Akko CS Jelly Pink`, `Gateron`, etc.

---

## 3. 🆕 Filtro genérico `variantType` + `variantValue`

Antes estaban documentados en Swagger pero **no funcionaban** (daban 400). **Ahora sí funcionan.**

Permiten filtrar por **cualquier tipo de variante**, incluidos los que no tienen filtro propio (ej. `warranty`).
Se usan **juntos** (los dos):

```
GET /products?variantType=ram&variantValue=16GB
GET /products?variantType=warranty&variantValue=year
```

- `variantType` debe ser un valor válido del enum (si no, **400** de validación). Valores:
  `ram, storage, processor, vram, color, connectivity, screen_size, resolution, refresh_rate, warranty, condition, switch`.
- `variantValue` es match **parcial, case-insensitive** sobre el nombre de la variante.
- Si mandás solo uno de los dos, se ignora (no filtra, no rompe).

---

## 4. ✅ Todos los filtros de variante ahora DEVUELVEN DATOS

Antes, varios filtros de variante devolvían `total: 0` (no por bug, sino porque **no había datos**
cargados). Se poblaron variantes coherentes por categoría, así que **ahora todos traen resultados**.

Filtros de variante disponibles (todos parciales, case-insensitive) con un valor real de ejemplo:

| Filtro | Ejemplo | Devuelve |
|---|---|---|
| `ram` | `?ram=16GB` | 24 |
| `storage` | `?storage=1TB` | 24 |
| `processor` | `?processor=Ryzen` | 6 |
| `vram` | `?vram=GDDR` | 16 |
| `color` | `?color=Negro` | 59 |
| `connectivity` | `?connectivity=USB` | 31 |
| `screen_size` | `?screen_size=27` | 11 |
| `resolution` | `?resolution=2560` | 9 |
| `refresh_rate` | `?refresh_rate=165Hz` | (monitores 165Hz) |
| `switch` | `?switch=Cherry` | 3 |
| `condition` | `?condition=New` | 112 |
| `warranty` (vía genérico) | `?variantType=warranty&variantValue=year` | 42 |

> Cada filtro de variante hace un match parcial sobre el **nombre** de la variante de ese tipo.
> Ojo con el valor: `?refresh_rate=144` da 0 porque no hay monitores de 144Hz (son 60/165/180/240Hz).
> Usá los valores que existan (los podés sacar de las variantes que devuelve el producto).

---

## 5. Cómo saber qué valores existen (para armar los selectores del filtro)

Cada producto devuelve su array `variants: [{ type, name, priceModifier, stock, isAvailable }]`.
Para poblar los dropdowns de filtros por categoría, juntá los `name` distintos por `type` de los
productos de esa categoría (o usá `GET /products/:id/variants-grouped` para un producto puntual).

---

## Resumen para el front

| Cambio | Acción |
|---|---|
| `categoryId` → `category_name` | Reemplazar el param del filtro de categoría (usar el nombre) |
| `switch` (nuevo) | Se puede filtrar teclados por tipo de switch |
| `variantType` + `variantValue` (ahora reales) | Filtro genérico para cualquier tipo de variante |
| Todos los filtros de variante | Ya devuelven datos (antes varios daban 0 por falta de datos) |
