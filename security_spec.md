# Security Specification - AutoWorks Pro

## 1. Data Invariants
- A **WorkOrder** must always be associated with the `uid` of the manager who created it (`managerId`).
- A **WorkOrder** cannot have its `managerId` changed after creation.
- An **InventoryItem** must always belong to a specific workshop manager (`managerId`).
- Only the owner of a document (matching `managerId`) can read, update, or delete it.
- **User** profiles are strictly private and can only be accessed by the user matching the document ID.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

| ID | Target Path | Payload | Expected Result | Reason |
|----|-------------|---------|-----------------|--------|
| T1 | `/users/attackerId` | `{ "name": "Attacker", "role": "admin", "email": "victim@gmail.com" }` | **DENIED** | Email must match auth token. |
| T2 | `/workOrders/wo1` | `{ "managerId": "otherUser", "status": "Ready" }` | **DENIED** | Cannot set `managerId` to another user. |
| T3 | `/workOrders/wo1` | `{ "managerId": "me", "status": "Ready", "ghostField": "true" }` | **DENIED** | Strict key validation (size == 9). |
| T4 | `/workOrders/wo1` | `{ ...valid, "orderNumber": "A".repeat(200) }` | **DENIED** | Size limit on strings (max 20). |
| T5 | `/inventory/item1` | `{ ...valid, "price": "expensive" }` | **DENIED** | Type safety (price must be number). |
| T6 | `/inventory/item1` | `delete` | **DENIED** | If requested by non-owner. |
| T7 | `/workOrders/` | `list` (where managerId == other) | **DENIED** | Query enforcer checks resource managerId. |
| T8 | `/users/me` | `{ "role": "superadmin" }` | **DENIED** | Role enum check. |
| T9 | `/workOrders/wo1` | `{ ...valid, "status": "InvalidStatus" }` | **DENIED** | Enum validation. |
| T10| `/inventory/item1`| `{ ...valid, "stock": -5 }` | **DENIED** | (Added logic for positive stock). |
| T11| `/workOrders/wo1` | `{ "updatedAt": "2020-01-01" }` | **DENIED** | Should use server time (enforced via updatedAt in rules). |
| T12| `/users/victimId` | `get` | **DENIED** | Privacy isolation. |

## 3. Conflict Report

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|-------------------|--------------------|
| users | Protected (uid=id) | N/A | Size/Type limits |
| workOrders | Protected (managerId) | Enum limited | String/Array size limits |
| inventory | Protected (managerId) | N/A | Type/Size limits |

## 4. Final Audit Result
**STATUS: SECURE**
The rules implement the "Master Gate" pattern, strict key checks, and tiered identity logic.

---
*Note: This specification is based on the ABAC model implemented in `firestore.rules`.*
