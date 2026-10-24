# Activity Definition Standard (ADS)

**Version:** 1.1.0  
**Status:** Approved for implementation  
**Scope:** Standalone reusable definitions for physical movements, postures, breathwork, and meditation, shared by the Activity Library, Micro Workout Tracker, and Workout Dashboard.  
**Format:** UTF-8 JSON; catalog is a top-level array of activity objects.  
**Validation:** `activity.schema.json` (JSON Schema Draft 2020-12), plus cross-record and vocabulary checks in this document.

## Core principle

An **activity** is one reusable, stable-ID definition. A workout, guided flow, or meditation routine **references activities** and controls sequence, repetitions, sets, durations, cadence, breath timing, rests, and coaching cues for that specific session. Activity records do **not** prescribe workout dosage or record user progress.

## Canonical fields (all required, 18 fields)

| Name | Type | Meaning / constraints |
|---|---|---|
| `id` | string | Permanent slug matching `^[a-z0-9]+(-[a-z0-9]+)*$`; globally unique across merged catalog |
| `name` | string | Nonempty display name, up to 120 characters |
| `category` | enum | Exactly one primary purpose; see vocabulary |
| `modalities` | string[] | At least one; multiple training disciplines allowed; no duplicates |
| `activityType` | enum | Basic execution nature: Dynamic, Isometric, Static Stretch, Flow, Breathing, Meditation |
| `movementPattern` | string | Controlled classification. For non-movement practice use Attention Regulation, Stillness, Body Awareness, or Breathing Control |
| `primaryMuscles` | string[] | **May be empty** for non-muscular activities; no duplicates |
| `secondaryMuscles` | string[] | May be empty; no duplicates |
| `equipment` | string[] | At least one label; use `None` for equipment-free practices |
| `difficulty` | enum | Beginner, Intermediate, Advanced; execution skill not intensity |
| `laterality` | enum | bilateral, unilateral, alternating; for non-lateral practices use bilateral conventionally |
| `description` | string | Short summary; may be empty |
| `instructions` | string[] | One or more nonempty, ordered instructional steps |
| `tips` | string | Technique guidance; may be empty |
| `media` | object | Exactly `image` and `video`, each a string URL/path or empty string; one of each |
| `variations` | string[] | IDs of related activities; may be empty; no duplicates or self-references |
| `tags` | string[] | Flexible search keywords; may be empty; no duplicates |
| `source` | enum | `builtin` or `custom` origin marker, not an access-control system |

Unknown fields are invalid (`additionalProperties: false`). Field names and enumerations are case-sensitive. No record-level schema-version property is necessary; the contract has its own version.

## Vocabulary and classification

The canonical values are in `vocabulary.json`. The category field remains single-valued, and now includes `Breathwork` and `Mindfulness` alongside Strength, Mobility, Balance, Stretching, Cardio. `modalities` allows multiple values, including Yoga, Pilates, Isometric, Tai Chi, Breathwork, Meditation, and Mindfulness. `activityType` supersedes the earlier **proposed** `movementType` field; the existing `movementPattern` field is retained for compatibility.

Category and activity type should be chosen independently: Warrior III could have category Balance, modalities Yoga and Isometric, and type Isometric. Meditation can have category Mindfulness and type Meditation. Some flow exercises may be defined as individual activities; longer multi-step routines should instead be workout/sequence prescriptions.

`primaryMuscles: []` is valid when a muscular target is not useful (such as breath awareness). Never add invented muscle values as placeholders. `equipment: ["None"]` means no equipment; `Bodyweight` describes bodyweight-dependent physical movements. Values in `movementPattern`, muscles, and equipment are checked against shared vocabulary by the catalog application, in addition to structural JSON Schema checks.

## Cross-record and integration constraints

1. Every `id` is stable and unique across built-in and custom activity datasets. Retain existing IDs such as `push-up` permanently.
2. `variations` references must resolve in the *merged* catalog, must not equal the containing activity ID, and should avoid cycles or contradictory relations.
3. Avoid duplicating a muscle between primary and secondary lists. Label comparisons should honor vocabulary spelling/case.
4. Paths in media should resolve against a documented catalog base URL, rather than the requesting app's current page.
5. Store favorites and user history **outside** this activity definition. `source` does not grant permissions.
6. Missing references from routines must remain visible as unresolved IDs, not silently substituted.
7. Workout records can reference activities using `activityId`. Existing workout `exerciseId` references continue to work via compatibility lookup during migration. The **value** of the ID does not change.
8. Dosage and execution parameters (reps, sets, hold seconds, inhale/exhale phases, cadence, rest) belong in **workout prescription JSON**, not activity definitions.

## Migration from Exercise Standard v1.0.0 / v1.1 draft

* Rename the canonical catalog filename `exercises.json` → `activities.json`, the schema `exercise.schema.json` → `activity.schema.json`, and documentation `EXERCISE_STANDARD.md` → `ACTIVITY_STANDARD.md`.
* Preserve all original exercise IDs, names, media, and variation links.
* Add `modalities` inferred from exercise category and equipment when missing; assign `activityType` from movement characteristics. Mappings are best-effort defaults and should be reviewed by the user.
* If `movementType` exists from the earlier 1.1 draft, map it to `activityType`, then remove `movementType`.
* Empty `primaryMuscles` is now valid. Do not invent `Unspecified` muscle classifications.
* Update editor forms, export/import, and schema validations together. Back up custom activities and favorites before migrations.
* This v1.1.0 contract supersedes both Exercise Standard v1.0.0 and the earlier Exercise Standard v1.1.0 draft.

## Example definitions

See `example-activities.json` for schema-valid entries covering push-ups, isometrics, yoga poses, yoga flow, Pilates, breathwork, mindfulness and meditation, Tai Chi, and plyometrics. These are **activity definitions**, not routine prescriptions.

Example workout prescription (illustrative only; separately versioned schema):

```json
{
  "activityId": "box-breathing",
  "durationSeconds": 120,
  "breathing": {"inhaleSeconds": 4, "holdAfterInhaleSeconds": 4, "exhaleSeconds": 4, "holdAfterExhaleSeconds": 4}
}
```

## Versioning and validation

Schema version: **1.1.0**. Validate full arrays against `activity.schema.json`, then perform cross-record ID/reference and controlled-label verification using `vocabulary.json`. The JSON Schema validates the fixed enums (category, difficulty, laterality, modalities, activity type), shapes, types, and uniqueness of individual arrays. It does not independently verify global ID uniqueness or cross-record references. Changes in required fields or meanings need a versioned compatibility review.
