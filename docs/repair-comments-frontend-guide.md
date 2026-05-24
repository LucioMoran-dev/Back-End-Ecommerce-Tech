# Guía de integración Frontend — Repair Comments (Historial de seguimiento)

## Contexto

Se implementó un sistema de comentarios de seguimiento en el backend. Cada vez que un admin cambia el estado de una reparación, se guarda automáticamente un comentario interno. Ahora el frontend necesita consumir el nuevo endpoint y adaptar el flujo existente.

---

## 1. Endpoint nuevo: Historial de comentarios

```
GET /repairs/:id/comments
```

**Auth:** Bearer token (rol ADMIN requerido)

**Response 200:**
```json
{
  "repair": {
    "id": "uuid",
    "fullName": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "phone": "+541112345678",
    "deviceType": "laptop",
    "brand": "MSI",
    "model": "GF63 Thin",
    "issueDescription": "La pantalla no enciende",
    "urgency": "medium",
    "status": "in_progress",
    "adminNotes": "Se requiere cambio de pantalla",
    "createdAt": "2026-03-10T14:30:00.000Z",
    "updatedAt": "2026-03-15T09:00:00.000Z"
  },
  "comments": [
    {
      "id": "uuid",
      "adminId": "uuid",
      "adminName": "Admin Name",
      "comment": "Revisando el equipo, se detectó daño en la pantalla",
      "statusSnapshot": "reviewing",
      "createdAt": "2026-03-11T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "adminId": "uuid",
      "adminName": "Admin Name",
      "comment": "Se requiere cambio de pantalla",
      "statusSnapshot": "in_progress",
      "createdAt": "2026-03-12T15:30:00.000Z"
    }
  ]
}
```

**Response 404:** Reparación no encontrada.

**Notas:**
- Los comentarios vienen ordenados cronológicamente (ASC).
- `statusSnapshot` indica el estado de la reparación en el momento del comentario.
- `adminName` es el nombre del admin que hizo el cambio.

---

## 2. Endpoint existente modificado: Actualizar estado

```
PATCH /repairs/:id/status
```

**Sin cambios en el contrato del request.** El body sigue siendo:
```json
{
  "status": "reviewing",
  "adminNotes": "Revisando el equipo"    // opcional, max 1000 chars
}
```

**Lo que cambió internamente:**
- Ahora `adminNotes` (si se envía) se guarda como comentario de seguimiento además de actualizar la reparación.
- Si no se envía `adminNotes`, se genera un comentario automático: `"Estado actualizado a {status}"`.
- El admin se identifica automáticamente desde el JWT token.
- **No se requiere ningún cambio en la llamada del frontend a este endpoint.**

---

## 3. Enums de referencia (para tipar en frontend)

```typescript
enum RepairStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

enum RepairUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

enum DeviceType {
  LAPTOP = 'laptop',
  DESKTOP = 'desktop',
  MONITOR = 'monitor',
  HARD_DRIVE = 'hard-drive',
  COMPONENT = 'component',
  OTHER = 'other',
}
```

---

## 4. Interfaces TypeScript sugeridas para el frontend

```typescript
interface RepairComment {
  id: string;
  adminId: string;
  adminName: string;
  comment: string;
  statusSnapshot: RepairStatus;
  createdAt: string; // ISO 8601
}

interface Repair {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  deviceType: DeviceType;
  brand: string;
  model: string;
  issueDescription: string;
  urgency: RepairUrgency;
  status: RepairStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RepairHistory {
  repair: Repair;
  comments: RepairComment[];
}
```

---

## 5. Labels para mostrar estados en español

```typescript
const statusLabels: Record<RepairStatus, string> = {
  pending: 'Pendiente',
  reviewing: 'En revisión',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};
```

---

## 6. Flujo sugerido en la UI del admin

### Vista de detalle de reparación
1. Al entrar al detalle de una reparación, hacer dos llamadas:
   - `GET /repairs/:id` → datos de la reparación
   - `GET /repairs/:id/comments` → historial completo (incluye la reparación también)
   - **O simplemente usar solo** `GET /repairs/:id/comments` que ya trae ambos datos.

2. Mostrar una **timeline/línea de tiempo** con los comentarios:
   - Cada entrada muestra: fecha, nombre del admin, comentario, y badge con el estado en ese momento.
   - Ordenado de más antiguo a más reciente (ya viene así del backend).

### Cambio de estado
1. El admin selecciona nuevo estado + escribe notas (opcional).
2. Se envía `PATCH /repairs/:id/status` con `{ status, adminNotes }`.
3. **No hay que hacer nada extra** — el backend guarda el comentario automáticamente.
4. Después del PATCH exitoso, refrescar el historial con `GET /repairs/:id/comments`.

### Transiciones de estado válidas
```
pending → reviewing → in_progress → completed
                                   → cancelled
pending → cancelled (directo también es válido)
```
- `completed` y `cancelled` son estados finales — no se puede cambiar desde ellos (el backend retorna 400).

---

## 7. Ejemplo de llamada con fetch

```typescript
// Obtener historial
const getRepairHistory = async (repairId: string): Promise<RepairHistory> => {
  const response = await fetch(`${API_URL}/repairs/${repairId}/comments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Error fetching repair history');
  return response.json();
};

// Actualizar estado (el comentario se guarda solo en backend)
const updateRepairStatus = async (
  repairId: string,
  status: RepairStatus,
  adminNotes?: string,
): Promise<Repair> => {
  const response = await fetch(`${API_URL}/repairs/${repairId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, adminNotes }),
  });
  if (!response.ok) throw new Error('Error updating repair status');
  return response.json();
};
```
