/**
 * The Skin Sensé brand tokens — taken from theskinsense.com (plum family)
 * plus a champagne-gold accent for the premium app look.
 * Used by both the Expo app and the Next.js dashboard.
 */
export const colors = {
  plumDeep: "#4A0E3F", // hero surfaces, headings
  plum: "#6E165E", // primary (site --primary-color)
  berry: "#702963", // secondary action (site --accent-color)
  plumLine: "#6E2A62", // dividers on dark plum
  lilac: "#FDF2FF", // chips, soft fills (site --secondary-color)
  blush: "#FEF7F8", // app background (site --accent-secondary-color)
  white: "#FFFFFF",
  ink: "#212121", // body text (site --text-color)
  muted: "#6B5866", // secondary text, AA on blush
  border: "#EBD9E6",
  gold: "#B8935A", // premium accent
  goldText: "#8A6A3A", // gold that passes contrast as text
  champagne: "#F3E3C7",
  cream: "#FFFCF7",
  success: "#2F7D5B",
  warning: "#B4690E",
  danger: "#B3261E",
} as const;

export const fonts = {
  display: "Cormorant Garamond",
  body: "Merriweather Sans",
} as const;

export const radii = { sm: 12, md: 22, lg: 28, pill: 999 } as const;

export const clinic = {
  name: "The Skin Sensé",
  doctor: "Dr. Alekya Singapore",
  address: "Bhavya's Fantastika, 201, Road No. 12, Banjara Hills, Hyderabad 500034",
  phones: ["+91 90146 96430", "+91 90002 92167"],
  whatsapp: "+919000292167",
  email: "contact@theskinsense.com",
  hours: "Mon–Sat, 10 AM – 5 PM",
  timezone: "Asia/Kolkata",
  website: "https://www.theskinsense.com",
} as const;
