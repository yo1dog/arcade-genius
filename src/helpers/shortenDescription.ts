export default function shortenDescription(description:string): string {
  return description.replace(/\(.+\)/g, '').trim().replace(/ {2,}/g, ' ');
}