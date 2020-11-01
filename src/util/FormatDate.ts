export function FormatDate(d: Date): string {
	let now = Date.now();
	let unix = +d;

	let diff = now - unix;

	if (diff < 60 * 1000) return "just now";
	if (diff < 3600 * 1000) return Math.round(diff / 1000 / 60) + ` minute${Math.round(diff / 1000 / 60) > 1 ? "s" : ""} ago`;
	if (diff < 3600 * 24 * 1000) return Math.round(diff / 1000 / 3600) + ` hour${Math.round(diff / 1000 / 3600) > 1 ? "s" : ""} ago`;
	if (diff < 3600 * 24 * 2 * 1000) return "yesterday at " + d.getHours() + ":" + (d.getMinutes() + "").padStart(2, "0");

	if (d.getFullYear() == new Date().getFullYear()) return months[d.getMonth()] + " " +
		d.getDate() + OrdinalSuffix(d.getDate()) + ", " + d.getHours() + ":" + (d.getMinutes() + "").padStart(2, "0");

	return months[d.getMonth()] + " " + d.getDate() + OrdinalSuffix(d.getDate()) + " " + 
		d.getFullYear() + ", " + d.getHours() + ":" + (d.getMinutes() + "").padStart(2, "0");
}

export function OrdinalSuffix(n: number): string {
  let j = n % 10, k = n % 100;
  if (j == 1 && k != 11) return "st";
  if (j == 2 && k != 12) return "nd";
  if (j == 3 && k != 13) return "rd";
  return "th";
}

export const days: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const months: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
