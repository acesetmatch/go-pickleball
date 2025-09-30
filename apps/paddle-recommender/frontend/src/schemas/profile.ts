import { z } from 'zod';

// Budget schema
export const BudgetSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
}).refine(data => data.min <= data.max, {
  message: "Minimum budget must be less than or equal to maximum budget",
  path: ["min"]
});

// Environment schema
export const EnvironmentSchema = z.object({
  indoor_pct: z.number().min(0).max(100),
  outdoor_pct: z.number().min(0).max(100),
  common_opponents: z.array(z.enum(['bangers', 'dinkers', 'mixed'])),
}).refine(data => data.indoor_pct + data.outdoor_pct === 100, {
  message: "Indoor and outdoor percentages must sum to 100",
  path: ["indoor_pct"]
});

// Aspirations schema
export const AspirationsSchema = z.object({
  primary_goal: z.enum(['power', 'control', 'consistency', 'spin', 'comfort']),
  target_rating: z.number().min(2.5).max(5.5).optional(),
});

// Physical schema
export const PhysicalSchema = z.object({
  arm_sensitivity: z.boolean(),
  grip_size: z.enum(['4', '4_1/8', '4_1/4', '4_3/8', '4_1/2', '4_5/8', '4_3/4']).optional(),
  handle_pref: z.enum(['short', 'standard', 'long']).optional(),
  height_ft: z.number().min(3).max(8).optional(),
  height_in: z.number().min(0).max(11).optional(),
  wingspan_ft: z.number().min(3).max(8).optional(),
  wingspan_in: z.number().min(0).max(11).optional(),
  weight_tolerance: z.enum(['light', 'medium', 'heavy']).optional(),
});

// Play Context schema
export const PlayContextSchema = z.object({
  rating: z.number().min(2.5).max(5.5),
  plays: z.enum(['singles', 'doubles', 'both']),
  competitive: z.enum(['rec', 'league', 'tournament']),
});

// Style schema
export const StyleSchema = z.object({
  styles: z.array(z.enum(['aggressive', 'all_court', 'reset_first', 'hand_speed', 'singles', 'driving_banger', 'soft_game', 'flicker']))
    .min(1, "Must select at least one style")
    .max(2, "Can select maximum 2 styles"),
  priority: z.enum(['power', 'control', 'spin']),
});

// Setup Pain schema
export const SetupPainSchema = z.object({
  current_paddle_id: z.string().nullable().optional(),
  pain_points: z.array(z.enum(['resets_short', 'popups', 'blocks_shallow', 'low_spin', 'wrist_slow', 'vibration']))
    .max(2, "Can select maximum 2 pain points"),
  notes: z.string().optional(),
});

// Feel & Customize schema (for the new step)
export const FeelCustomizeSchema = z.object({
  feel: z.enum(['power', 'control', 'balanced']),
  customize: z.boolean(),
});

// Preferences schema
export const PreferencesSchema = z.object({
  budget: BudgetSchema,
  brand_like: z.array(z.string()).optional(),
  brand_avoid: z.array(z.string()).optional(),
  feel: z.enum(['power', 'control', 'balanced']).optional(),
  customize: z.boolean().optional(),
});

// Main Profile schema
export const ProfileSchema = z.object({
  play: PlayContextSchema,
  style: StyleSchema,
  physical: PhysicalSchema,
  setup: SetupPainSchema,
  env: EnvironmentSchema,
  prefs: PreferencesSchema,
  aspirations: AspirationsSchema,
});

// Video Meta schema
export const VideoMetaSchema = z.object({
  upload_id: z.string(),
  duration_ms: z.number().positive(),
  fps: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  quality: z.object({
    lighting: z.enum(['ok', 'low']),
    stability: z.enum(['ok', 'needs_steady']),
    subject_size: z.enum(['ok', 'small']),
  }),
  consent: z.object({
    store_video: z.boolean(),
    share_metrics: z.boolean(),
  }),
});

// Type exports
export type Budget = z.infer<typeof BudgetSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export type Aspirations = z.infer<typeof AspirationsSchema>;
export type Physical = z.infer<typeof PhysicalSchema>;
export type PlayContext = z.infer<typeof PlayContextSchema>;
export type Style = z.infer<typeof StyleSchema>;
export type SetupPain = z.infer<typeof SetupPainSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type VideoMeta = z.infer<typeof VideoMetaSchema>;

// Helper function to derive outdoor percentage
export const deriveOutdoorPct = (indoorPct: number): number => {
  return 100 - indoorPct;
};

// Validation helpers
export const validateProfile = (profile: unknown) => {
  return ProfileSchema.safeParse(profile);
};

export const validateVideoMeta = (videoMeta: unknown) => {
  return VideoMetaSchema.safeParse(videoMeta);
};
