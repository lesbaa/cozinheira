
export type FeatureType = {
  id: string;
  color: string;
  mesh: string;
  hidden?: boolean;
  sizeMultiplier?: number;
  isCanvasMesh?: boolean;
}

export const FeatureTypesConfig: Record<string, FeatureType> = {
  SOB: { 
    id: "SOB",
    color: "",
    mesh: "Blobbed_1",
    sizeMultiplier: 1.5,
  },
  MARM: { 
    id: "MARM",
    color: "",
    mesh: "Bubbled_4",
    sizeMultiplier: 0.75,
  },
  HAWTH: { 
    id: "HAWTH",
    color: "",
    mesh: "Dead_3",
    sizeMultiplier: 0.75,
  },
  AMEND: { 
    id: "AMEND",
    color: "",
    mesh: "Blobbed_1",
    sizeMultiplier: 1,
  },
  FIG: { 
    id: "FIG",
    color: "",
    mesh: "Boxed_4",
    sizeMultiplier: 1,
  },
  CARVP: { 
    id: "CARVP",
    color: "",
    mesh: "Blobbed_2",
    sizeMultiplier: 1,
  },
  AZINH: { 
    id: "AZINH",
    color: "",
    mesh: "Blobbed_5",
    sizeMultiplier: 0.75,
  },
  LILAC: { 
    id: "LILAC",
    color: "",
    mesh: "Bubbled_5",
    sizeMultiplier: 0.5,
  },
  AMEIXA: { 
    id: "AMEIXA",
    color: "",
    mesh: "Boxed_5",
    sizeMultiplier: 0.75,
  },
  CYP: { 
    id: "CYP",
    color: "",
    mesh: "Boxed_1",
    sizeMultiplier: 2,
  },
  OSYRISALBA: { 
    id: "OSYRISALBA",
    color: "",
    mesh: "Dead_3",
    sizeMultiplier: 0.25,
  },
  GILB: { 
    id: "GILB",
    color: "",
    mesh: "Boxed_3",
    sizeMultiplier: 0.5,
  },
  HERA: { 
    id: "HERA",
    color: "",
    mesh: "Climber",
  },
  MADRESSILVA: { 
    id: "MADRESSILVA",
    color: "",
    mesh: "ClimberTwo",
  },
  GORSE: { 
    id: "GORSE",
    color: "",
    mesh: "Dead_2",
    sizeMultiplier: 0.5,
  },
  GORREIRO: { 
    id: "GORREIRO",
    color: "",
    mesh: "Dead_2",
    sizeMultiplier: 0.5,
  },
  SALGB: { 
    id: "SALGB",
    color: "",
    mesh: "Domed_1",
    sizeMultiplier: 0.75,
  },
  OLIVEIRA: { 
    id: "OLIVEIRA",
    color: "",
    mesh: "Bubbled_1",
    sizeMultiplier: 1,
  },
  WELL: { 
    id: "well",
    color: "",
    mesh: "Bucket",
    isCanvasMesh: true,
  },
  UNKNOWN: { 
    id: "UNKNOWN",
    color: "",
    mesh: "QuestionMark",
    isCanvasMesh: true,
  },
  POND: { 
    id: "pond",
    color: "",
    mesh: "Droplet",
    isCanvasMesh: true,
  },
} as const;