---
name: route-derived-ids
description: Controllers / route handlers set IDs on commands from route parameters; request-body validators must NOT re-validate those fields. TRIGGER when adding or editing a controller action / route handler with an ID placeholder in the route template, or writing / updating the validator / schema for the matching request body.
---

# Route-derived IDs

When an ID appears in the route (e.g., `/orgs/{orgId}/shipments/{shipmentId}`), the **controller / route handler** populates it on the command / DTO from the route parameter. The client's request body must not supply it, and the validator / schema must not check it.

## The pattern

### .NET (ASP.NET + MediatR + FluentValidation)

```csharp
// Controller
[HttpPut("orgs/{orgId:guid}/shipments/{shipmentId:guid}")]
public async Task<IActionResult> Update(
    Guid orgId,
    Guid shipmentId,
    [FromBody] UpdateShipmentCommand command,
    CancellationToken ct)
{
    command.OrgId = orgId;            // server-populated from route
    command.ShipmentId = shipmentId;  // server-populated from route
    var result = await _mediator.Send(command, ct);
    return Ok(result);
}

// Validator — DO NOT validate route-derived IDs
public class UpdateShipmentCommandValidator : AbstractValidator<UpdateShipmentCommand>
{
    public UpdateShipmentCommandValidator()
    {
        // RuleFor(x => x.OrgId).NotEmpty();       // WRONG — server-populated
        // RuleFor(x => x.ShipmentId).NotEmpty();  // WRONG — server-populated
        RuleFor(x => x.DeliveryDate).NotEmpty();   // fine — client-supplied
        RuleFor(x => x.Items).NotEmpty();          // fine — client-supplied
    }
}
```

### TypeScript (Express / Fastify / NestJS + Zod)

```ts
// Handler
router.put('/orgs/:orgId/shipments/:shipmentId', async (req, res) => {
  const command = { ...req.body, orgId: req.params.orgId, shipmentId: req.params.shipmentId };
  const result = await mediator.send(new UpdateShipment(command));
  res.json(result);
});

// Zod schema for the body — does NOT include orgId / shipmentId
const UpdateShipmentBody = z.object({
  deliveryDate: z.string().datetime(),
  items: z.array(ItemSchema).min(1),
});
```

### Python (FastAPI + Pydantic)

```python
@router.put("/orgs/{org_id}/shipments/{shipment_id}")
async def update(org_id: UUID, shipment_id: UUID, body: UpdateShipmentBody):
    command = UpdateShipmentCommand(org_id=org_id, shipment_id=shipment_id, **body.dict())
    return await mediator.send(command)

class UpdateShipmentBody(BaseModel):
    delivery_date: datetime
    items: list[ItemSchema]
    # NOT: org_id / shipment_id — those come from the path
```

### Spring (Java) / Rails (Ruby) follow the same shape: the route-derived ID is set by the controller, the request-body validator leaves it out.

## Rules

1. **Route-derived fields** on the command / DTO are **writable** by the controller. Don't use `init`-only / `readonly` / `frozen` on those specific fields. Other client-supplied fields can still be immutable.
2. **Request-body validators / schemas** for those fields are **omitted**. If they're absent from the body, that's correct — they get populated afterwards.
3. **Route constraints** (`:guid`, `{id:int}`, parsing of `UUID` in FastAPI) catch parse failures at routing time. Those never reach the handler, so handler code can assume the ID parsed.
4. **Business checks on the resolved ID** (e.g., "does this shipment exist for this org?") live in the **handler**, not the validator — they need the repository.

## Why the validator carve-out matters

The validator runs against the command **after** the controller populates the route fields, but past bugs slipped through when validators were written to also cover route IDs. A validator that fails on a route-derived ID produces `"orgId must not be empty"` to a client who never set `orgId` — misleading and hard to debug. Keep the validator focused on what the client actually sent.

## Smells

- A command / DTO with all fields immutable including route IDs — the controller can't set them.
- A validator rule on a property that also appears in the route template.
- A handler checking `if (command.OrgId == Guid.Empty) throw ...` — route constraints + controller assignment make this unreachable for route IDs. That check is valid for *client-supplied* IDs only.
- Client code having to pass the ID in **both** the URL and the body.

## When you find a violation

1. Remove the validator rule on the route-derived field.
2. If the command / DTO had the field as immutable, change it so the controller can set it.
3. Add a one-line comment at the controller assignment explaining that the ID comes from the route — it saves the next reader from re-adding the validator rule.
