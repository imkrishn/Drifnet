//function manage high value

export function manageHighValue(value: number) {
  if (value < 1000) return String(value);
  if (value >= 1000 && value < 1000000) {
    const res = (value / 1000).toFixed(1);
    return String(res) + "k";
  } else {
    const res = (value / 1000000).toFixed(1);
    return String(res) + "k";
  }
}
