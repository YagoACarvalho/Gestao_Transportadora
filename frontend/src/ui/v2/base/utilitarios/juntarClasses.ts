export function juntarClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
