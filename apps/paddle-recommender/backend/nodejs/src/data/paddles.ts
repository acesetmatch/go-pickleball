import { Paddle } from '../types';

const paddles: Paddle[] = [ // TEMPORARILY DISABLED FOR DATABASE TESTING
  {
    id: "engage-pursuit-mx-6.0",
    name: "Pursuit MX 6.0",
    brand: "Engage",
    price: "$199.99",
    weight: "7.8",
    grip: "medium",
    surface: "textured",
    core: "Polymer",
    playStyle: "balanced",
    recommendedFor: "intermediate",
    description: "A versatile paddle perfect for players looking to balance power and control.",
    image: "/images/engage-pursuit-mx.jpg",
    specifications: {
      shape: "Elongated",
      surface: "Carbon Fiber",
      average_weight: 220.5,
      core: 16.0,
      paddle_length: 16.5,
      paddle_width: 7.5,
      grip_length: 5.0,
      grip_type: "Cushion",
      grip_circumference: 4.25
    },
    performance: {
      power: 85.0,
      pop: 78.0,
      spin: 3200.0,
      twist_weight: 210.0,
      swing_weight: 225.0,
      balance_point: 29.5
    }
  },
  {
    id: "selkirk-vanguard-power-air",
    name: "Vanguard Power Air",
    brand: "Selkirk",
    price: "$179.99",
    weight: "7.6",
    grip: "small",
    surface: "smooth",
    core: "Polymer",
    playStyle: "power",
    recommendedFor: "intermediate",
    description: "Designed for aggressive players who want maximum power and pop.",
    image: "/images/selkirk-vanguard.jpg",
    specifications: {
      shape: "Wide-body",
      surface: "Fiberglass",
      average_weight: 215.0,
      core: 14.0,
      paddle_length: 15.75,
      paddle_width: 8.0,
      grip_length: 4.75,
      grip_type: "Comfort",
      grip_circumference: 4.0
    },
    performance: {
      power: 90.0,
      pop: 70.0,
      spin: 2800.0,
      twist_weight: 205.0,
      swing_weight: 220.0,
      balance_point: 28.0
    }
  },
  {
    id: "joola-hyperion-cfs",
    name: "Hyperion CFS",
    brand: "JOOLA",
    price: "$249.99",
    weight: "7.2",
    grip: "large",
    surface: "textured",
    core: "Honeycomb",
    playStyle: "control",
    recommendedFor: "advanced",
    description: "Professional-grade paddle with exceptional spin and control capabilities.",
    image: "/images/joola-hyperion.jpg",
    specifications: {
      shape: "Hybrid",
      surface: "Carbon Fiber",
      average_weight: 205.0,
      core: 13.5,
      paddle_length: 16.0,
      paddle_width: 7.75,
      grip_length: 5.25,
      grip_type: "Tennis",
      grip_circumference: 4.5
    },
    performance: {
      power: 82.0,
      pop: 85.0,
      spin: 3500.0,
      twist_weight: 195.0,
      swing_weight: 210.0,
      balance_point: 30.0
    }
  },
  {
    id: "franklin-signature-ben-johns",
    name: "Signature Ben Johns",
    brand: "Franklin",
    price: "$219.99",
    weight: "7.4",
    grip: "medium",
    surface: "textured",
    core: "Polymer",
    playStyle: "balanced",
    recommendedFor: "advanced",
    description: "Signature paddle of pro player Ben Johns, offering elite performance.",
    image: "/images/franklin-ben-johns.jpg",
    specifications: {
      shape: "Elongated",
      surface: "Carbon Fiber",
      average_weight: 210.0,
      core: 15.0,
      paddle_length: 16.25,
      paddle_width: 7.25,
      grip_length: 5.0,
      grip_type: "Premium",
      grip_circumference: 4.25
    },
    performance: {
      power: 88.0,
      pop: 82.0,
      spin: 3300.0,
      twist_weight: 200.0,
      swing_weight: 215.0,
      balance_point: 29.0
    }
  },
  {
    id: "paddletek-tempest-wave-pro",
    name: "Tempest Wave Pro",
    brand: "Paddletek",
    price: "$159.99",
    weight: "7.9",
    grip: "small",
    surface: "smooth",
    core: "Polymer",
    playStyle: "power",
    recommendedFor: "beginner",
    description: "Great entry-level paddle with solid power and forgiving sweet spot.",
    image: "/images/paddletek-tempest.jpg",
    specifications: {
      shape: "Wide-body",
      surface: "Graphite",
      average_weight: 225.0,
      core: 16.5,
      paddle_length: 15.5,
      paddle_width: 8.25,
      grip_length: 4.5,
      grip_type: "Standard",
      grip_circumference: 4.0
    },
    performance: {
      power: 92.0,
      pop: 68.0,
      spin: 2600.0,
      twist_weight: 215.0,
      swing_weight: 230.0,
      balance_point: 27.5
    }
  },
  {
    id: "gearbox-cx14e",
    name: "CX14E",
    brand: "Gearbox",
    price: "$289.99",
    weight: "7.1",
    grip: "large",
    surface: "textured",
    core: "Honeycomb",
    playStyle: "control",
    recommendedFor: "advanced",
    description: "Premium paddle for players who prioritize spin and precise shot placement.",
    image: "/images/gearbox-cx14e.jpg",
    specifications: {
      shape: "Elongated",
      surface: "Carbon Fiber",
      average_weight: 200.0,
      core: 14.0,
      paddle_length: 16.75,
      paddle_width: 7.0,
      grip_length: 5.5,
      grip_type: "Tennis",
      grip_circumference: 4.75
    },
    performance: {
      power: 80.0,
      pop: 88.0,
      spin: 3600.0,
      twist_weight: 190.0,
      swing_weight: 205.0,
      balance_point: 31.0
    }
  },
  {
    id: "head-radical-pro",
    name: "Radical Pro",
    brand: "HEAD",
    price: "$139.99",
    weight: "8.1",
    grip: "medium",
    surface: "smooth",
    core: "Polymer",
    playStyle: "balanced",
    recommendedFor: "beginner",
    description: "Affordable paddle perfect for beginners learning the game.",
    image: "/images/head-radical-pro.jpg",
    specifications: {
      shape: "Standard",
      surface: "Fiberglass",
      average_weight: 230.0,
      core: 15.5,
      paddle_length: 15.75,
      paddle_width: 7.75,
      grip_length: 4.75,
      grip_type: "Standard",
      grip_circumference: 4.25
    },
    performance: {
      power: 75.0,
      pop: 72.0,
      spin: 2400.0,
      twist_weight: 220.0,
      swing_weight: 235.0,
      balance_point: 28.5
    }
  },
  {
    id: "wilson-energy-pro",
    name: "Energy Pro",
    brand: "Wilson",
    price: "$99.99",
    weight: "8.3",
    grip: "small",
    surface: "smooth",
    core: "Polymer",
    playStyle: "control",
    recommendedFor: "beginner",
    description: "Budget-friendly option with good control for new players.",
    image: "/images/wilson-energy-pro.jpg",
    specifications: {
      shape: "Wide-body",
      surface: "Composite",
      average_weight: 235.0,
      core: 16.0,
      paddle_length: 15.5,
      paddle_width: 8.0,
      grip_length: 4.5,
      grip_type: "Basic",
      grip_circumference: 4.0
    },
    performance: {
      power: 70.0,
      pop: 65.0,
      spin: 2200.0,
      twist_weight: 225.0,
      swing_weight: 240.0,
      balance_point: 27.0
    }
  }
];

export const paddleData = {
  paddles
};
