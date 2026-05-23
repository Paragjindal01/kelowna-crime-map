export type Camera = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
};

export const cameras: Camera[] = [
  {
    id: "cam1",
    name: "Harvey Ave & Gordon Dr (Red Light)",
    lat: 49.8818,
    lng: -119.4856,
    type: "traffic",
  },
  {
    id: "cam2",
    name: "WR Bennett Bridge",
    lat: 49.8837,
    lng: -119.4976,
    type: "traffic",
  },
  {
    id: "cam3",
    name: "Stuart Park Webcam",
    lat: 49.8896,
    lng: -119.4960,
    type: "public",
  },
];