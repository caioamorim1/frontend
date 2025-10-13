/**
 * Gera uma cor em uma escala de gradiente (Azul -> Amarelo -> Vermelho) com base em um valor.
 * - Valores baixos se aproximam do azul.
 * - Valores médios se aproximam do amarelo.
 * - Valores altos se aproximam do vermelho.
 *
 * @param value O valor do item atual.
 * @param minValue O menor valor em todo o conjunto de dados.
 * @param maxValue O maior valor em todo o conjunto de dados.
 * @returns Uma string de cor HSL (ex: 'hsl(120, 90%, 60%)').
 */
export const generateMultiColorScale = (
  value: number,
  minValue: number,
  maxValue: number
): string => {
  // Evita divisão por zero se todos os valores forem iguais
  if (maxValue === minValue) {
    return "hsl(60, 90%, 60%)"; // Retorna um amarelo (cor do meio do gradiente)
  }

  const percentage = (value - minValue) / (maxValue - minValue);

  let hue;
  if (percentage < 0.5) {
    // ---- MUDANÇA AQUI ----
    // Interpola entre Verde (hue=120) e Amarelo (hue=60)
    // O range de matiz agora é 120 - 60 = 60
    hue = 120 - (percentage / 0.5) * 60;
  } else {
    // NENHUMA MUDANÇA AQUI
    // Continua interpolando entre Amarelo (60) e Vermelho (0)
    hue = 60 - ((percentage - 0.5) / 0.5) * 60;
  }

  // Retorna a cor HSL final
  return `hsl(${hue}, 90%, 60%)`;
};

export const COLORS = [
  "#003151",
  "#0b6f88",
  "#6497b1",
  "#a8dadc",
  "#457b9d",
  "#1d3557",
];

/**
 * Gera uma cor em escala monocromática de azul com base em um valor.
 * - Valores baixos: azul claro
 * - Valores altos: azul escuro
 *
 * @param value O valor do item atual.
 * @param minValue O menor valor em todo o conjunto de dados.
 * @param maxValue O maior valor em todo o conjunto de dados.
 * @returns Uma string de cor HSL (ex: 'hsl(210, 80%, 45%)').
 */
export const generateBlueMonochromaticScale = (
  value: number,
  minValue: number,
  maxValue: number
): string => {
  // Evita divisão por zero se todos os valores forem iguais
  if (maxValue === minValue) {
    return "hsl(210, 70%, 50%)"; // Retorna um azul médio
  }

  const percentage = (value - minValue) / (maxValue - minValue);

  // Matiz fixo em 210 (azul)
  const hue = 210;

  // Saturação fixa em 80%
  const saturation = 80;

  // Luminosidade varia de 75% (azul claro) a 25% (azul escuro)
  // Valores maiores = mais escuro
  const lightness = 75 - percentage * 50;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
