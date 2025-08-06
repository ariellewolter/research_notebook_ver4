# FreeformDrawingBlock API Documentation

## Overview

The FreeformDrawingBlock API provides CRUD operations for managing freeform drawing blocks across different entity types (notes, projects, protocols, tasks, and database entries). The API supports polymorphic relationships and universal access patterns.

## Base URL

```
/api/blocks
```

## Data Models

### FreeformDrawingBlock

```typescript
interface FreeformDrawingBlock {
  id: string;
  blockId: string;
  entityId: string;
  entityType: 'note' | 'project' | 'protocol' | 'task' | 'database';
  strokes: string; // JSON string of DrawingStroke[]
  svgPath: string;
  pngThumbnail: string;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### DrawingStroke

```typescript
interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
  opacity: number;
}
```

### DrawingPoint

```typescript
interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}
```

## Endpoints

### 1. Get Freeform Drawing Blocks by Entity

**GET** `/api/blocks/:entityType/:entityId/freeform`

Retrieves all freeform drawing blocks for a specific entity.

#### Parameters

- `entityType` (path): One of `note`, `project`, `protocol`, `task`, `database`
- `entityId` (path): The ID of the entity
- `page` (query, optional): Page number for pagination (default: 1)
- `limit` (query, optional): Number of items per page (default: 20)

#### Example Request

```bash
GET /api/blocks/note/123e4567-e89b-12d3-a456-426614174000/freeform?page=1&limit=10
```

#### Example Response

```json
{
  "blocks": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "blockId": "drawing-block-1",
      "entityId": "123e4567-e89b-12d3-a456-426614174000",
      "entityType": "note",
      "strokes": "[{\"id\":\"stroke-1\",\"points\":[...],\"color\":\"#000000\",\"width\":2,\"opacity\":1}]",
      "svgPath": "<svg>...</svg>",
      "pngThumbnail": "data:image/png;base64,...",
      "width": 600,
      "height": 400,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 2. Get Specific Freeform Drawing Block

**GET** `/api/blocks/freeform/:blockId`

Retrieves a specific freeform drawing block by its blockId.

#### Parameters

- `blockId` (path): The unique block ID

#### Example Request

```bash
GET /api/blocks/freeform/drawing-block-1
```

#### Example Response

```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "blockId": "drawing-block-1",
  "entityId": "123e4567-e89b-12d3-a456-426614174000",
  "entityType": "note",
  "strokes": "[{\"id\":\"stroke-1\",\"points\":[...],\"color\":\"#000000\",\"width\":2,\"opacity\":1}]",
  "svgPath": "<svg>...</svg>",
  "pngThumbnail": "data:image/png;base64,...",
  "width": 600,
  "height": 400,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3. Create Freeform Drawing Block

**POST** `/api/blocks/freeform`

Creates a new freeform drawing block.

#### Request Body

```typescript
{
  blockId: string;
  entityId: string;
  entityType: 'note' | 'project' | 'protocol' | 'task' | 'database';
  strokes?: string; // JSON string of DrawingStroke[]
  svgPath?: string;
  pngThumbnail?: string;
  width?: number; // default: 600
  height?: number; // default: 400
}
```

#### Example Request

```bash
POST /api/blocks/freeform
Content-Type: application/json

{
  "blockId": "drawing-block-2",
  "entityId": "123e4567-e89b-12d3-a456-426614174000",
  "entityType": "note",
  "strokes": "[{\"id\":\"stroke-1\",\"points\":[{\"x\":10,\"y\":10,\"timestamp\":1640995200000}],\"color\":\"#000000\",\"width\":2,\"opacity\":1}]",
  "svgPath": "<svg width=\"600\" height=\"400\">...</svg>",
  "pngThumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "width": 600,
  "height": 400
}
```

#### Example Response

```json
{
  "id": "456e7890-e89b-12d3-a456-426614174002",
  "blockId": "drawing-block-2",
  "entityId": "123e4567-e89b-12d3-a456-426614174000",
  "entityType": "note",
  "strokes": "[{\"id\":\"stroke-1\",\"points\":[...],\"color\":\"#000000\",\"width\":2,\"opacity\":1}]",
  "svgPath": "<svg>...</svg>",
  "pngThumbnail": "data:image/png;base64,...",
  "width": 600,
  "height": 400,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. Update Freeform Drawing Block

**PUT** `/api/blocks/freeform/:blockId`

Updates an existing freeform drawing block.

#### Parameters

- `blockId` (path): The unique block ID

#### Request Body

```typescript
{
  strokes?: string;
  svgPath?: string;
  pngThumbnail?: string;
  width?: number;
  height?: number;
}
```

#### Example Request

```bash
PUT /api/blocks/freeform/drawing-block-2
Content-Type: application/json

{
  "strokes": "[{\"id\":\"stroke-2\",\"points\":[...],\"color\":\"#FF0000\",\"width\":3,\"opacity\":0.8}]",
  "svgPath": "<svg updated>...</svg>",
  "width": 800,
  "height": 600
}
```

### 5. Delete Freeform Drawing Block

**DELETE** `/api/blocks/freeform/:blockId`

Deletes a freeform drawing block.

#### Parameters

- `blockId` (path): The unique block ID

#### Example Request

```bash
DELETE /api/blocks/freeform/drawing-block-2
```

#### Response

- **204 No Content**: Block deleted successfully

### 6. Get Statistics

**GET** `/api/blocks/freeform/stats`

Retrieves statistics about freeform drawing blocks.

#### Example Request

```bash
GET /api/blocks/freeform/stats
```

#### Example Response

```json
{
  "total": 15,
  "byEntityType": {
    "note": 8,
    "project": 3,
    "protocol": 2,
    "task": 1,
    "database": 1
  },
  "recent": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "blockId": "drawing-block-1",
      "entityType": "note",
      "entityId": "123e4567-e89b-12d3-a456-426614174000",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 7. Bulk Create Freeform Drawing Blocks

**POST** `/api/blocks/freeform/bulk`

Creates multiple freeform drawing blocks in a single request.

#### Request Body

```typescript
{
  blocks: CreateFreeformDrawingBlockRequest[]
}
```

#### Example Request

```bash
POST /api/blocks/freeform/bulk
Content-Type: application/json

{
  "blocks": [
    {
      "blockId": "bulk-block-1",
      "entityId": "123e4567-e89b-12d3-a456-426614174000",
      "entityType": "note",
      "strokes": "[]",
      "svgPath": "",
      "pngThumbnail": "",
      "width": 600,
      "height": 400
    },
    {
      "blockId": "bulk-block-2",
      "entityId": "789e0123-e89b-12d3-a456-426614174000",
      "entityType": "project",
      "strokes": "[]",
      "svgPath": "",
      "pngThumbnail": "",
      "width": 800,
      "height": 600
    }
  ]
}
```

#### Example Response

```json
{
  "message": "Created 2 freeform drawing blocks",
  "count": 2
}
```

### 8. Search Freeform Drawing Blocks

**GET** `/api/blocks/freeform/search`

Searches freeform drawing blocks with optional filtering.

#### Query Parameters

- `q` (optional): Search query for blockId or entityId
- `entityType` (optional): Filter by entity type
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 20)

#### Example Request

```bash
GET /api/blocks/freeform/search?q=drawing&entityType=note&page=1&limit=10
```

#### Example Response

```json
{
  "blocks": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "blockId": "drawing-block-1",
      "entityId": "123e4567-e89b-12d3-a456-426614174000",
      "entityType": "note",
      "strokes": "[...]",
      "svgPath": "<svg>...</svg>",
      "pngThumbnail": "data:image/png;base64,...",
      "width": 600,
      "height": 400,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_enum_value",
      "expected": "note | project | protocol | task | database",
      "received": "invalid",
      "path": ["entityType"],
      "message": "Entity type must be one of: note, project, protocol, task, database"
    }
  ]
}
```

### 404 Not Found

```json
{
  "error": "Freeform drawing block not found"
}
```

### 409 Conflict

```json
{
  "error": "Block with this ID already exists"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create freeform drawing block"
}
```

## Universal Route Pattern

The API uses a universal route pattern that works across all entity types:

```
/api/blocks/{entityType}/{entityId}/freeform
```

Where:
- `{entityType}` can be: `note`, `project`, `protocol`, `task`, `database`
- `{entityId}` is the ID of the specific entity

This pattern allows the same API endpoints to work seamlessly across different entity types while maintaining proper polymorphic relationships in the database.

## Polymorphic Relationships

The FreeformDrawingBlock model maintains polymorphic relationships with all supported entity types:

- **Notes**: Drawing blocks for research notes and observations
- **Projects**: Drawing blocks for project planning and diagrams
- **Protocols**: Drawing blocks for experimental procedures and flowcharts
- **Tasks**: Drawing blocks for task planning and sketches
- **Database Entries**: Drawing blocks for data visualization and annotations

Each relationship is properly indexed for optimal query performance. 