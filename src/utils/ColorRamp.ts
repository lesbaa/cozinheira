const ColorRamps = {
  Lumo: [
    {
      color: 'yellow',
      value: 1,
    },
    {
      color: 'orange',
      value: 1,
    },
    {
      color: 'magenta',
      value: 0.7,
    },
    {
      color: '#13195a',
      value: 0,
    },
  ],
  Greyscale: [
    {
      color: '#ffffff',
      value: 1,
    },
    {
      color: '#000000',
      value: 0,
    },
  ]
}

export default ColorRamps;

export type ColorRamp = {
  color: string;
  value: number;
}[];