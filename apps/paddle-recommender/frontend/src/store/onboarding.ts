import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Profile, 
  VideoMeta, 
  PlayContext, 
  Style, 
  Physical, 
  SetupPain, 
  Environment, 
  Preferences, 
  Aspirations,
  ProfileSchema,
  PlayContextSchema,
  StyleSchema,
  PhysicalSchema,
  SetupPainSchema,
  FeelCustomizeSchema,
  EnvironmentSchema,
  PreferencesSchema,
  AspirationsSchema,
  VideoMetaSchema,
  deriveOutdoorPct
} from '../schemas/profile';

interface OnboardingState {
  // State
  profile: Partial<Profile>;
  video?: VideoMeta;
  step: number;

  // Actions
  setPlayContext: (play: Partial<PlayContext>) => void;
  setStyle: (style: Partial<Style>) => void;
  setPhysical: (physical: Partial<Physical>) => void;
  setSetupPain: (setup: Partial<SetupPain>) => void;
  setEnvironment: (env: Partial<Environment>) => void;
  setPreferences: (prefs: Partial<Preferences>) => void;
  setAspirations: (aspirations: Partial<Aspirations>) => void;
  setVideo: (video: VideoMeta) => void;

  // Navigation
  next: () => boolean;
  back: () => void;
  reset: () => void;
  goToStep: (step: number) => void;

  // Validation
  validateCurrentStep: () => boolean;
  getStepErrors: () => string[];
  isStepComplete: (step: number) => boolean;

  // Skip Logic
  shouldShowWindQuestions: () => boolean;
  shouldShowArmSensitivityDetails: () => boolean;
  shouldShowCustomizationQuestions: () => boolean;
  shouldShowAdvancedMetrics: () => boolean;
  shouldShowCompetitiveQuestions: () => boolean;
}

// Default profile state
const defaultProfile: Partial<Profile> = {
  play: {
    rating: 3.0,
  },
  style: {
    styles: [],
    priority: 'control'
  },
  physical: {
    arm_sensitivity: false,
    weight_tolerance: 'medium'
  },
  setup: {
    pain_points: [],
    current_paddle_id: null
  },
  env: {
    indoor_pct: 50,
    outdoor_pct: 50,
    common_opponents: []
  },
  prefs: {
    budget: {
      min: 50,
      max: 200
    }
  },
  aspirations: {
    primary_goal: 'consistency'
  }
} as Partial<Profile>;

// Step validation schemas
const stepValidators = [
  PlayContextSchema,      // Step 0: Skill Level & Context
  StyleSchema,           // Step 1: Play Style & Tendencies  
  PhysicalSchema,        // Step 2: Physical Factors
  FeelCustomizeSchema,   // Step 3: Paddle Feel & Customization
  SetupPainSchema,       // Step 4: Current Setup & Pain Points
  EnvironmentSchema,     // Step 5: Environment & Opponents
  PreferencesSchema,     // Step 6: Budget & Brand Preferences
  AspirationsSchema      // Step 7: Aspirations / Goals
  // VideoMetaSchema.optional() // Step 8: Optional Video / Data Capture - Disabled for now
];

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      profile: defaultProfile,
      video: undefined,
      step: 0,

      // Section setters
      setPlayContext: (play) => set((state) => ({
        profile: {
          ...state.profile,
          play: { ...state.profile.play, ...play }
        }
      })),

      setStyle: (style) => set((state) => ({
        profile: {
          ...state.profile,
          style: { ...state.profile.style, ...style }
        }
      })),

      setPhysical: (physical) => set((state) => ({
        profile: {
          ...state.profile,
          physical: { ...state.profile.physical, ...physical }
        }
      })),

      setSetupPain: (setup) => set((state) => ({
        profile: {
          ...state.profile,
          setup: { ...state.profile.setup, ...setup }
        }
      })),

      setEnvironment: (env) => {
        // Auto-derive outdoor_pct if indoor_pct is provided
        const updatedEnv = env.indoor_pct !== undefined 
          ? { ...env, outdoor_pct: deriveOutdoorPct(env.indoor_pct) }
          : env;
          
        set((state) => ({
          profile: {
            ...state.profile,
            env: { ...state.profile.env, ...updatedEnv }
          }
        }));
      },

      setPreferences: (prefs) => set((state) => ({
        profile: {
          ...state.profile,
          prefs: { ...state.profile.prefs, ...prefs }
        }
      })),

      setAspirations: (aspirations) => set((state) => ({
        profile: {
          ...state.profile,
          aspirations: { ...state.profile.aspirations, ...aspirations }
        }
      })),

      setVideo: (video) => set({ video }),

      // Navigation
      next: () => {
        const state = get();
        if (state.validateCurrentStep() && state.step < 8) {
          set({ step: state.step + 1 });
          return true;
        }
        return false;
      },

      back: () => set((state) => ({ 
        step: Math.max(0, state.step - 1) 
      })),

      reset: () => set({
        profile: defaultProfile,
        video: undefined,
        step: 0
      }),

      goToStep: (step) => {
        if (step >= 0 && step <= 8) {
          set({ step });
        }
      },

      // Validation
      validateCurrentStep: () => {
        const state = get();
        const validator = stepValidators[state.step];
        
        if (!validator) return true;
        
        let dataToValidate;
        switch (state.step) {
          case 0: dataToValidate = state.profile.play; break;
          case 1: dataToValidate = state.profile.style; break;
          case 2: dataToValidate = state.profile.physical; break;
          case 3: dataToValidate = { feel: state.profile.prefs?.feel, customize: state.profile.prefs?.customize }; break;
          case 4: dataToValidate = state.profile.setup; break;
          case 5: dataToValidate = state.profile.env; break;
          case 6: dataToValidate = state.profile.prefs; break;
          case 7: dataToValidate = state.profile.aspirations; break;
          default: return true;
        }
        
        const result = validator.safeParse(dataToValidate);
        return result.success;
      },

      getStepErrors: () => {
        const state = get();
        const validator = stepValidators[state.step];
        
        if (!validator) return [];
        
        let dataToValidate;
        switch (state.step) {
          case 0: dataToValidate = state.profile.play; break;
          case 1: dataToValidate = state.profile.style; break;
          case 2: dataToValidate = state.profile.physical; break;
          case 3: dataToValidate = { feel: state.profile.prefs?.feel, customize: state.profile.prefs?.customize }; break;
          case 4: dataToValidate = state.profile.setup; break;
          case 5: dataToValidate = state.profile.env; break;
          case 6: dataToValidate = state.profile.prefs; break;
          case 7: dataToValidate = state.profile.aspirations; break;
          // case 8: dataToValidate = state.video; break; // Video step disabled
          default: return [];
        }
        
        const result = validator.safeParse(dataToValidate);
        if (result.success) return [];
        
        return result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
      },

      isStepComplete: (step: number) => {
        const state = get();
        const validator = stepValidators[step];

        if (!validator) return true;

        let dataToValidate;
        switch (step) {
          case 0: dataToValidate = state.profile.play; break;
          case 1: dataToValidate = state.profile.style; break;
          case 2: dataToValidate = state.profile.physical; break;
          case 3: dataToValidate = { feel: state.profile.prefs?.feel, customize: state.profile.prefs?.customize }; break;
          case 4: dataToValidate = state.profile.setup; break;
          case 5: dataToValidate = state.profile.env; break;
          case 6: dataToValidate = state.profile.prefs; break;
          case 7: dataToValidate = state.profile.aspirations; break;
          // case 8: return true; // Video step is optional - disabled for now
          default: return true;
        }

        const result = validator.safeParse(dataToValidate);
        return result.success;
      },

      // Skip Logic - Conditionally show/hide questions based on previous answers
      shouldShowWindQuestions: () => {
        const state = get();
        // Show wind questions only if user plays outdoors more than 20% of the time
        return (state.profile.env?.outdoor_pct ?? 0) > 20;
      },

      shouldShowArmSensitivityDetails: () => {
        const state = get();
        // Show arm sensitivity follow-up questions only if they indicated sensitivity
        return state.profile.physical?.arm_sensitivity === true;
      },

      shouldShowCustomizationQuestions: () => {
        const state = get();
        // Show customization questions for intermediate+ players
        const skillLevel = state.profile.play?.skill_level;
        return skillLevel !== 'beginner';
      },

      shouldShowAdvancedMetrics: () => {
        const state = get();
        // Show advanced metrics (twist weight, swing weight, etc.) for advanced+ players
        const skillLevel = state.profile.play?.skill_level;
        return skillLevel === 'advanced' || skillLevel === 'expert';
      },

      shouldShowCompetitiveQuestions: () => {
        const state = get();
        // Show tournament/competitive questions if they play tournaments
        const tournamentLevel = state.profile.play?.tournament_level;
        return tournamentLevel !== 'none' && tournamentLevel !== undefined;
      }
    }),
    {
      name: 'onboarding-store',
    }
  )
);

// Export step titles for UI
export const STEP_TITLES = [
  'Skill Level & Context',
  'Play Style & Tendencies', 
  'Physical Factors',
  'Paddle Feel & Customization',
  'Current Setup & Pain Points',
  'Environment & Opponents',
  'Budget & Brand Preferences',
  'Aspirations / Goals'
  // 'Optional Video / Data Capture' // Disabled for now - future release
];

// Export step descriptions
export const STEP_DESCRIPTIONS = [
  'Tell us about your rating, game format, and competitive level',
  'Describe your playing style and strategic preferences',
  'Share physical considerations that affect paddle choice',
  'Tell us about your paddle preferences and customization habits',
  'What paddle do you use now and what frustrates you?',
  'Where do you play and what opponents do you face?',
  'Set your budget and brand preferences',
  'What do you want to improve in your game?'
  // 'Upload a video for deeper personalization (optional)' // Disabled for now - future release
];
